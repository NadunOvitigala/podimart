import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, mediaUrl } from "../api";
import { ContactActions } from "../components/ContactActions";
import { ProductCard } from "../components/ProductCard";
import type { Product, Seller } from "../types";

export function ShopPage() {
  const { slug = "" } = useParams();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .shop(slug)
      .then((data) => {
        setSeller(data.seller);
        setProducts(data.products);
      })
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  if (error) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!seller) return <div className="wrap" style={{ paddingTop: 40 }}>Loading shop…</div>;

  return (
    <div className="wrap">
      <section className="shop-hero">
        <div>
          <span className="chip">{seller.city}</span>
          <h1>{seller.name}</h1>
          <p className="lede">{seller.bio || "A home business on Podimart."}</p>
          {seller.pickup_notes ? <p>Pickup: {seller.pickup_notes}</p> : null}
          {seller.delivery_notes ? <p>Delivery: {seller.delivery_notes}</p> : null}
        </div>
        <div className="panel">
          <img
            src={mediaUrl(seller.avatar_url)}
            alt=""
            style={{ borderRadius: 12, height: 160, width: "100%", objectFit: "cover", marginBottom: 12 }}
          />
          <ContactActions seller={seller} />
        </div>
      </section>
      <div className="section-head">
        <h2>Products</h2>
      </div>
      <div className="grid grid-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
