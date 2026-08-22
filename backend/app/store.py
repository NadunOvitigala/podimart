from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol

import boto3
from boto3.dynamodb.conditions import Key

from app.config import settings
from app.schemas import public_seller

LOCK = threading.Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def slugify(name: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in name).strip("-")
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned[:48] or "shop"


class Store(Protocol):
    def get_seller(self, seller_id: str) -> dict[str, Any] | None: ...
    def get_seller_by_email(self, email: str) -> dict[str, Any] | None: ...
    def get_seller_by_slug(self, slug: str) -> dict[str, Any] | None: ...
    def list_sellers(self, city: str | None = None) -> list[dict[str, Any]]: ...
    def put_seller(self, seller: dict[str, Any]) -> dict[str, Any]: ...
    def get_product(self, product_id: str) -> dict[str, Any] | None: ...
    def list_products(
        self,
        category: str | None = None,
        city: str | None = None,
        seller_id: str | None = None,
    ) -> list[dict[str, Any]]: ...
    def put_product(self, product: dict[str, Any]) -> dict[str, Any]: ...
    def delete_product(self, product_id: str, seller_id: str) -> bool: ...
    def put_order(self, order: dict[str, Any]) -> dict[str, Any]: ...
    def list_orders(self, seller_id: str) -> list[dict[str, Any]]: ...
    def is_empty(self) -> bool: ...


class LocalStore:
    def __init__(self, path: Path):
        self.path = path
        if not self.path.exists():
            self._write({"sellers": [], "products": [], "orders": []})

    def _read(self) -> dict[str, list[dict[str, Any]]]:
        with LOCK:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        data.setdefault("sellers", [])
        data.setdefault("products", [])
        data.setdefault("orders", [])
        return data

    def _write(self, data: dict[str, Any]) -> None:
        with LOCK:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def is_empty(self) -> bool:
        data = self._read()
        return not data["sellers"] and not data["products"]

    def get_seller(self, seller_id: str) -> dict[str, Any] | None:
        return next((s for s in self._read()["sellers"] if s["id"] == seller_id), None)

    def get_seller_by_email(self, email: str) -> dict[str, Any] | None:
        email = email.lower()
        return next((s for s in self._read()["sellers"] if s["email"] == email), None)

    def get_seller_by_slug(self, slug: str) -> dict[str, Any] | None:
        return next((s for s in self._read()["sellers"] if s["slug"] == slug), None)

    def list_sellers(self, city: str | None = None) -> list[dict[str, Any]]:
        sellers = self._read()["sellers"]
        products = self._read()["products"]
        if city:
            sellers = [s for s in sellers if s["city"].lower() == city.lower()]
        out = []
        for seller in sellers:
            item = public_seller(seller)
            item["product_count"] = sum(1 for p in products if p["seller_id"] == seller["id"])
            out.append(item)
        return out

    def put_seller(self, seller: dict[str, Any]) -> dict[str, Any]:
        data = self._read()
        existing = next((i for i, s in enumerate(data["sellers"]) if s["id"] == seller["id"]), None)
        if existing is None:
            data["sellers"].append(seller)
        else:
            data["sellers"][existing] = seller
        self._write(data)
        return seller

    def get_product(self, product_id: str) -> dict[str, Any] | None:
        return next((p for p in self._read()["products"] if p["id"] == product_id), None)

    def list_products(
        self,
        category: str | None = None,
        city: str | None = None,
        seller_id: str | None = None,
    ) -> list[dict[str, Any]]:
        products = self._read()["products"]
        if category:
            products = [p for p in products if p["category"] == category]
        if city:
            products = [p for p in products if p["city"].lower() == city.lower()]
        if seller_id:
            products = [p for p in products if p["seller_id"] == seller_id]
        return sorted(products, key=lambda p: p.get("created_at", ""), reverse=True)

    def put_product(self, product: dict[str, Any]) -> dict[str, Any]:
        data = self._read()
        existing = next((i for i, p in enumerate(data["products"]) if p["id"] == product["id"]), None)
        if existing is None:
            data["products"].append(product)
        else:
            data["products"][existing] = product
        self._write(data)
        return product

    def delete_product(self, product_id: str, seller_id: str) -> bool:
        data = self._read()
        before = len(data["products"])
        data["products"] = [
            p
            for p in data["products"]
            if not (p["id"] == product_id and p["seller_id"] == seller_id)
        ]
        self._write(data)
        return len(data["products"]) < before

    def put_order(self, order: dict[str, Any]) -> dict[str, Any]:
        data = self._read()
        data["orders"].append(order)
        self._write(data)
        return order

    def list_orders(self, seller_id: str) -> list[dict[str, Any]]:
        orders = [item for item in self._read()["orders"] if item.get("seller_id") == seller_id]
        return sorted(orders, key=lambda item: item.get("created_at", ""), reverse=True)


class DynamoStore:
    def __init__(self) -> None:
        dynamo = boto3.resource("dynamodb", region_name=settings.aws_region)
        self.sellers = dynamo.Table(settings.table_sellers)
        self.products = dynamo.Table(settings.table_products)
        self.orders = dynamo.Table(settings.table_orders)

    def is_empty(self) -> bool:
        sellers = self.sellers.scan(Limit=1)
        return not sellers.get("Items")

    def get_seller(self, seller_id: str) -> dict[str, Any] | None:
        item = self.sellers.get_item(Key={"id": seller_id}).get("Item")
        return item

    def get_seller_by_email(self, email: str) -> dict[str, Any] | None:
        res = self.sellers.query(
            IndexName="email-index",
            KeyConditionExpression=Key("email").eq(email.lower()),
        )
        items = res.get("Items") or []
        return items[0] if items else None

    def get_seller_by_slug(self, slug: str) -> dict[str, Any] | None:
        res = self.sellers.query(
            IndexName="slug-index",
            KeyConditionExpression=Key("slug").eq(slug),
        )
        items = res.get("Items") or []
        return items[0] if items else None

    def list_sellers(self, city: str | None = None) -> list[dict[str, Any]]:
        if city:
            res = self.sellers.query(
                IndexName="city-index",
                KeyConditionExpression=Key("city").eq(city),
            )
            sellers = res.get("Items") or []
        else:
            sellers = self.sellers.scan().get("Items") or []
        out = []
        for seller in sellers:
            item = public_seller(seller)
            item["product_count"] = len(self.list_products(seller_id=seller["id"]))
            out.append(item)
        return out

    def put_seller(self, seller: dict[str, Any]) -> dict[str, Any]:
        self.sellers.put_item(Item=seller)
        return seller

    def get_product(self, product_id: str) -> dict[str, Any] | None:
        return self.products.get_item(Key={"id": product_id}).get("Item")

    def list_products(
        self,
        category: str | None = None,
        city: str | None = None,
        seller_id: str | None = None,
    ) -> list[dict[str, Any]]:
        if seller_id:
            res = self.products.query(
                IndexName="seller-index",
                KeyConditionExpression=Key("seller_id").eq(seller_id),
            )
            products = res.get("Items") or []
        elif category:
            res = self.products.query(
                IndexName="category-index",
                KeyConditionExpression=Key("category").eq(category),
            )
            products = res.get("Items") or []
        else:
            products = self.products.scan().get("Items") or []
        if city:
            products = [p for p in products if str(p.get("city", "")).lower() == city.lower()]
        if category and seller_id:
            products = [p for p in products if p.get("category") == category]
        return sorted(products, key=lambda p: p.get("created_at", ""), reverse=True)

    def put_product(self, product: dict[str, Any]) -> dict[str, Any]:
        item = dict(product)
        item["price"] = int(item["price"])
        self.products.put_item(Item=item)
        return product

    def delete_product(self, product_id: str, seller_id: str) -> bool:
        existing = self.get_product(product_id)
        if not existing or existing.get("seller_id") != seller_id:
            return False
        self.products.delete_item(Key={"id": product_id})
        return True

    def put_order(self, order: dict[str, Any]) -> dict[str, Any]:
        self.orders.put_item(Item=order)
        return order

    def list_orders(self, seller_id: str) -> list[dict[str, Any]]:
        try:
            res = self.orders.query(
                IndexName="seller-index",
                KeyConditionExpression=Key("seller_id").eq(seller_id),
            )
            orders = res.get("Items") or []
        except Exception:
            scanned = self.orders.scan().get("Items") or []
            orders = [item for item in scanned if item.get("seller_id") == seller_id]
        return sorted(orders, key=lambda item: item.get("created_at", ""), reverse=True)


def get_store() -> Store:
    if settings.storage.lower() == "dynamodb":
        return DynamoStore()
    return LocalStore(settings.data_dir / "db.json")
