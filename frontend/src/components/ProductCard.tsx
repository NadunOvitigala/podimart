import { Link } from "react-router-dom";
import { displayPrice, formatPrice, mediaUrl } from "../api";
import type { Product } from "../types";

function deliveryLine(product: Product): string {
  const parts: string[] = [];
  if (product.offers_pickup !== false) parts.push("Pickup");
  if (product.offers_delivery !== false) {
    const fee = Number(product.delivery_charge || 0);
    parts.push(fee > 0 ? `Delivery ${formatPrice(fee)}` : "Delivery");
  }
  if (!parts.length) return product.delivery_note || "Ask seller";
  return parts.join(" · ");
}

export function ProductCard({ product }: { product: Product }) {
  const hasPhoto = Boolean(product.image_url?.trim());

  return (
    <article className="card product-card">
      <Link className="card-link" to={`/product/${product.id}`}>
        <div className="card-media">
          <img
            className="cover"
            src={mediaUrl(product.image_url)}
            alt={product.name}
            loading="lazy"
          />
          {!hasPhoto ? <span className="photo-badge">Photo coming soon</span> : null}
        </div>
        <div className="card-body">
          <h3>{product.name}</h3>
          <span className="price">{displayPrice(product.price)}</span>
          <p className="card-seller">
            {product.seller_name}
            {product.city ? ` · ${product.city}` : ""}
          </p>
          <p className="card-fulfillment">
            {product.lead_time ? `${product.lead_time} · ` : ""}
            {deliveryLine(product)}
          </p>
        </div>
      </Link>
    </article>
  );
}
