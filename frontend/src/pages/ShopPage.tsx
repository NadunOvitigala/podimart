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

  const coverUrl = mediaUrl(seller.avatar_url);
  const identity = (
    <>
      <span className="chip">{seller.city}</span>
      <h1>{seller.name}</h1>
      {seller.bio ? <p className="lede">{seller.bio}</p> : null}
      <ContactActions seller={seller} variant="cover" />
    </>
  );

  return (
    <>
      {coverUrl ? (
        <section
          className="shop-cover has-photo"
          style={{ backgroundImage: `url(${coverUrl})` }}
        >
          <div className="shop-cover-inner">
            <div className="wrap shop-cover-copy">{identity}</div>
          </div>
        </section>
      ) : (
        <div className="wrap" style={{ paddingTop: 36 }}>
          {identity}
        </div>
      )}
      <div className="wrap">
        {seller.pickup_notes || seller.delivery_notes ? (
          <section className="shop-notes">
            {seller.pickup_notes ? <p>Pickup: {seller.pickup_notes}</p> : null}
            {seller.delivery_notes ? <p>Delivery: {seller.delivery_notes}</p> : null}
          </section>
        ) : null}
        <div className="section-head">
          <h2>Products</h2>
        </div>
        <div className="grid grid-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </>
  );
}
