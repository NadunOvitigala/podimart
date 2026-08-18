import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, formatPrice, mediaUrl } from "../api";
import { ContactActions } from "../components/ContactActions";
import type { Product, Seller } from "../types";

export function ProductPage() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .product(id)
      .then((data) => {
        setProduct(data.product);
        setSeller(data.seller);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!product) return <div className="wrap" style={{ paddingTop: 40 }}>Loading…</div>;

  return (
    <div className="wrap product-layout">
      <img
        src={mediaUrl(product.image_url)}
        alt={product.name}
        style={{ width: "100%", borderRadius: 18, minHeight: 320, objectFit: "cover" }}
      />
      <div>
        <span className="chip">{product.city}</span>
        <h1>{product.name}</h1>
        <p className="price" style={{ fontSize: 22 }}>
          {formatPrice(product.price)}
        </p>
        <p>{product.description}</p>
        <p className="muted">Lead time: {product.lead_time}</p>
        <p className="muted">By {product.seller_name}</p>
        {seller ? (
          <div className="panel" style={{ marginTop: 20 }}>
            <ContactActions seller={seller} product={product} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
