from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from mangum import Mangum

from app.auth import create_token, get_seller_id, hash_password, verify_password
from app.catalog import CATEGORIES, CITIES
from app.config import settings
from app.notify import notify_seller
from app.schemas import LoginIn, OrderIn, ProductIn, ProfileIn, SignupIn, public_seller
from app.seed import unique_slug
from app.store import Store, get_store, new_id, now_iso

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def create_app() -> FastAPI:
    app = FastAPI(title="Podimart API", version="0.1.0")
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    store = get_store()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

    def db() -> Store:
        return store

    @app.get("/")
    def root():
        return {"name": settings.app_name, "docs": "/docs"}

    @app.get("/health")
    def health():
        return {"ok": True, "name": settings.app_name}

    @app.get("/categories")
    def categories():
        return CATEGORIES

    @app.get("/cities")
    def cities():
        return CITIES

    @app.get("/sellers")
    def sellers(city: str | None = None, _store: Store = Depends(db)):
        return _store.list_sellers(city=city)

    @app.get("/sellers/{slug}")
    def seller_shop(slug: str, _store: Store = Depends(db)):
        seller = _store.get_seller_by_slug(slug)
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found.")
        products = _store.list_products(seller_id=seller["id"])
        return {"seller": public_seller(seller), "products": products}

    @app.get("/products")
    def products(
        category: str | None = None,
        city: str | None = None,
        seller_id: str | None = None,
        _store: Store = Depends(db),
    ):
        return _store.list_products(category=category, city=city, seller_id=seller_id)

    @app.get("/products/{product_id}")
    def product_detail(product_id: str, _store: Store = Depends(db)):
        product = _store.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        seller = _store.get_seller(product["seller_id"])
        return {
            "product": product,
            "seller": public_seller(seller) if seller else None,
        }

    @app.post("/orders")
    def create_order(body: OrderIn, _store: Store = Depends(db)):
        product = _store.get_product(body.product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        seller = _store.get_seller(product["seller_id"])
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found.")
        labels = {
            "cash_on_delivery": "Cash on delivery",
            "bank_transfer": "Bank transfer",
        }
        allowed = [
            m
            for m in (product.get("payment_methods") or list(labels.keys()))
            if m in labels
        ] or list(labels.keys())
        payment_method = body.payment_method.strip()
        if payment_method not in allowed:
            raise HTTPException(status_code=400, detail="Please choose an allowed payment method.")
        order_id = new_id()
        unit = int(product.get("price") or 0)
        quantity = body.quantity
        total = unit * quantity if unit > 0 else 0
        total_label = f"Rs {total:,}" if total > 0 else "Contact for price"
        code = (product.get("code") or "").strip().upper() or f"PM-{product['id'][:6].upper()}"
        order = {
            "id": order_id,
            "reference": f"PM-ORD-{order_id[:6].upper()}",
            "status": "pending",
            "product_id": product["id"],
            "product_name": product["name"],
            "product_code": code,
            "seller_id": seller["id"],
            "seller_name": seller["name"],
            "quantity": quantity,
            "unit_price": unit,
            "total": total,
            "total_label": total_label,
            "payment_method": payment_method,
            "payment_method_label": labels.get(payment_method, payment_method),
            "buyer_name": body.buyer_name.strip(),
            "buyer_phone": body.buyer_phone.strip(),
            "buyer_email": body.buyer_email.strip(),
            "note": body.note.strip(),
            "created_at": now_iso(),
        }
        _store.put_order(order)
        notified = notify_seller(order, seller)
        return {
            "order": {
                "reference": order["reference"],
                "product_name": order["product_name"],
                "quantity": order["quantity"],
                "total_label": order["total_label"],
                "payment_method": order["payment_method"],
                "payment_method_label": order["payment_method_label"],
            },
            "notified": notified,
        }

    @app.get("/me/orders")
    def my_orders(seller_id: str = Depends(get_seller_id), _store: Store = Depends(db)):
        return _store.list_orders(seller_id)

    @app.post("/auth/signup")
    def signup(body: SignupIn, _store: Store = Depends(db)):
        email = body.email.strip().lower()
        if _store.get_seller_by_email(email):
            raise HTTPException(status_code=400, detail="That email already has a shop.")
        if body.city not in CITIES:
            raise HTTPException(status_code=400, detail="Please pick a province from the list.")
        seller = {
            "id": new_id(),
            "email": email,
            "password_hash": hash_password(body.password),
            "name": body.name.strip(),
            "slug": unique_slug(_store, body.name),
            "city": body.city,
            "bio": "",
            "avatar_url": "",
            "whatsapp": body.whatsapp.strip(),
            "phone": body.phone.strip() or body.whatsapp.strip(),
            "email_public": email,
            "pickup_notes": "",
            "delivery_notes": "",
            "created_at": now_iso(),
        }
        _store.put_seller(seller)
        return {"token": create_token(seller["id"]), "seller": public_seller(seller)}

    @app.post("/auth/login")
    def login(body: LoginIn, _store: Store = Depends(db)):
        seller = _store.get_seller_by_email(body.email.strip().lower())
        if not seller or not verify_password(body.password, seller.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Email or password is wrong.")
        return {"token": create_token(seller["id"]), "seller": public_seller(seller)}

    @app.get("/me")
    def me(seller_id: str = Depends(get_seller_id), _store: Store = Depends(db)):
        seller = _store.get_seller(seller_id)
        if not seller:
            raise HTTPException(status_code=401, detail="Please log in.")
        products = _store.list_products(seller_id=seller_id)
        return {"seller": public_seller(seller), "products": products}

    @app.put("/me")
    def update_me(
        body: ProfileIn,
        seller_id: str = Depends(get_seller_id),
        _store: Store = Depends(db),
    ):
        seller = _store.get_seller(seller_id)
        if not seller:
            raise HTTPException(status_code=401, detail="Please log in.")
        updates = body.model_dump(exclude_unset=True)
        if "city" in updates and updates["city"] not in CITIES:
            raise HTTPException(status_code=400, detail="Please pick a province from the list.")
        if "name" in updates and updates["name"]:
            updates["name"] = updates["name"].strip()
        seller.update({k: v for k, v in updates.items() if v is not None})
        _store.put_seller(seller)
        return public_seller(seller)

    @app.post("/products")
    def create_product(
        body: ProductIn,
        seller_id: str = Depends(get_seller_id),
        _store: Store = Depends(db),
    ):
        seller = _store.get_seller(seller_id)
        if not seller:
            raise HTTPException(status_code=401, detail="Please log in.")
        if body.category not in {c["id"] for c in CATEGORIES}:
            raise HTTPException(status_code=400, detail="Unknown category.")
        product = {
            "id": new_id(),
            "seller_id": seller["id"],
            "seller_slug": seller["slug"],
            "seller_name": seller["name"],
            "city": seller["city"],
            "category": body.category,
            "name": body.name.strip(),
            "description": body.description.strip(),
            "price": body.price,
            "lead_time": body.lead_time.strip(),
            "image_url": body.image_url.strip(),
            "created_at": now_iso(),
        }
        return _store.put_product(product)

    @app.put("/products/{product_id}")
    def update_product(
        product_id: str,
        body: ProductIn,
        seller_id: str = Depends(get_seller_id),
        _store: Store = Depends(db),
    ):
        product = _store.get_product(product_id)
        if not product or product["seller_id"] != seller_id:
            raise HTTPException(status_code=404, detail="Product not found.")
        seller = _store.get_seller(seller_id)
        product.update(
            {
                "name": body.name.strip(),
                "category": body.category,
                "price": body.price,
                "description": body.description.strip(),
                "lead_time": body.lead_time.strip(),
                "image_url": body.image_url.strip() or product.get("image_url", ""),
                "seller_name": seller["name"] if seller else product["seller_name"],
                "city": seller["city"] if seller else product["city"],
            }
        )
        return _store.put_product(product)

    @app.delete("/products/{product_id}")
    def delete_product(
        product_id: str,
        seller_id: str = Depends(get_seller_id),
        _store: Store = Depends(db),
    ):
        if not _store.delete_product(product_id, seller_id):
            raise HTTPException(status_code=404, detail="Product not found.")
        return {"ok": True}

    @app.post("/media/upload")
    async def upload_image(
        file: UploadFile = File(...),
        seller_id: str = Depends(get_seller_id),
    ):
        suffix = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
        if not suffix:
            raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, or WebP photo.")
        data = await file.read()
        if len(data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Photo must be under 5MB.")
        filename = f"{seller_id}-{new_id()}{suffix}"
        if settings.s3_bucket:
            import boto3

            boto3.client("s3", region_name=settings.aws_region).put_object(
                Bucket=settings.s3_bucket,
                Key=f"products/{filename}",
                Body=data,
                ContentType=file.content_type,
            )
            base = settings.public_asset_base.rstrip("/")
            url = f"{base}/products/{filename}" if base else f"s3://{settings.s3_bucket}/products/{filename}"
            return {"url": url}

        dest: Path = settings.upload_dir / filename
        dest.write_bytes(data)
        return {"url": f"/uploads/{filename}"}

    return app


app = create_app()
handler = Mangum(app)

# Used by uvicorn: uvicorn app.main:app --reload --app-dir backend
