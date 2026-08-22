import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, mediaUrl } from "../api";
import { Breadcrumb } from "../components/Breadcrumb";
import { ContactActions } from "../components/ContactActions";
import { EmptyState } from "../components/EmptyState";
import { LoadingGrid } from "../components/LoadingGrid";
import { ProductCard } from "../components/ProductCard";
import type { Product, Seller } from "../types";

export function ShopPage() {
  const { slug = "" } = useParams();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .shop(slug)
      .then((data) => {
        setSeller(data.seller);
        setProducts(data.products);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (error) {
    return (
      <div className="wrap page-top">
        <p className="error">{error}</p>
      </div>
    );
  }
  if (loading || !seller) {
    return (
      <div className="wrap page-top">
        <LoadingGrid count={3} />
      </div>
    );
  }

  const coverUrl = mediaUrl(seller.avatar_url);
  const identity = (
    <>
      <Breadcrumb items={[{ label: "Marketplace", to: "/browse" }, { label: seller.name }]} />
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
        <div className="wrap page-top shop-cover-plain">{identity}</div>
      )}
      <div className="wrap mall">
        {seller.pickup_notes || seller.delivery_notes ? (
          <section className="shop-notes panel">
            <h2>Pickup &amp; delivery</h2>
            {seller.pickup_notes ? <p>{seller.pickup_notes}</p> : null}
            {seller.delivery_notes ? <p>{seller.delivery_notes}</p> : null}
          </section>
        ) : null}
        <div className="section-head">
          <h2>Products</h2>
          <span className="muted">{products.length} listing{products.length === 1 ? "" : "s"}</span>
        </div>
        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            text="This shop has not listed any products. Check back soon or contact the seller."
          />
        ) : (
          <div className="grid grid-mall">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
