from typing import Any

from pydantic import BaseModel, Field


def public_seller(seller: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": seller["id"],
        "name": seller["name"],
        "slug": seller["slug"],
        "city": seller["city"],
        "bio": seller.get("bio") or "",
        "avatar_url": seller.get("avatar_url") or "",
        "whatsapp": seller.get("whatsapp") or "",
        "phone": seller.get("phone") or "",
        "email_public": seller.get("email_public") or seller.get("email") or "",
        "pickup_notes": seller.get("pickup_notes") or "",
        "delivery_notes": seller.get("delivery_notes") or "",
        "product_count": seller.get("product_count", 0),
    }


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=80)
    city: str = Field(min_length=2, max_length=40)
    whatsapp: str = Field(default="", max_length=20)
    phone: str = Field(default="", max_length=20)


class LoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str


class ProfileIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    city: str | None = Field(default=None, min_length=2, max_length=40)
    bio: str | None = Field(default=None, max_length=600)
    whatsapp: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=20)
    email_public: str | None = Field(default=None, max_length=120)
    pickup_notes: str | None = Field(default=None, max_length=240)
    delivery_notes: str | None = Field(default=None, max_length=240)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    category: str
    subcategory: str = Field(default="", max_length=80)
    price: int = Field(ge=0, le=10_000_000)
    description: str = Field(default="", max_length=800)
    lead_time: str = Field(default="Order 2 days before", max_length=80)
    image_url: str = Field(default="", max_length=500)


class OrderIn(BaseModel):
    product_id: str = Field(min_length=4, max_length=40)
    quantity: int = Field(ge=1, le=99)
    payment_method: str = Field(min_length=2, max_length=40)
    buyer_name: str = Field(min_length=2, max_length=80)
    buyer_phone: str = Field(min_length=8, max_length=20)
    buyer_email: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=400)
