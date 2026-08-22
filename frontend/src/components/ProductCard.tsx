import { Link } from "react-router-dom";
import { displayPrice, mediaUrl } from "../api";
import type { Product } from "../types";

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
        </div>
      </Link>
    </article>
  );
}
