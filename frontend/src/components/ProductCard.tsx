import { Link } from "react-router-dom";
import { formatPrice, mediaUrl } from "../api";
import type { Product } from "../types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="card" to={`/product/${product.id}`}>
      <img className="cover" src={mediaUrl(product.image_url)} alt="" />
      <div className="card-body">
        <span className="chip">{product.city}</span>
        <h3>{product.name}</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          {product.seller_name}
        </p>
        <div className="price">{formatPrice(product.price)}</div>
      </div>
    </Link>
  );
}
