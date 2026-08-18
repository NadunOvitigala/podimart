import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../api";
import { ProductCard } from "../components/ProductCard";
import { SELLERCENTER_URL } from "../sites";
import type { Category, Product } from "../types";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.categories().then(setCategories).catch((err: Error) => setError(err.message));
    api
      .products()
      .then((items) => setProducts(items.slice(0, 8)))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <p className="chip">Free for makers and buyers</p>
          <h1>A shop page for home businesses.</h1>
          <p className="lede">
            Home bakers, painters, and crafters list their work for free.
            Buyers pick a category and city, then order on WhatsApp, call, or
            email.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-clay" to="/browse">
              Find homemade goods
            </Link>
            <a className="btn btn-ghost" href={`${SELLERCENTER_URL}/signup`}>
              Open a free shop
            </a>
          </div>
        </div>
        <div className="hero-photo">
          <img src="/images/hero-homemade.png" alt="Homemade cakes and crafts on a kitchen table" />
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <div className="section-head">
        <h2>Shop by category</h2>
        <Link to="/browse">See all</Link>
      </div>
      <div className="grid grid-3">
        {categories.map((category) => (
          <Link className="card" key={category.id} to={`/browse?category=${category.id}`}>
            <img className="cover" src={mediaUrl(category.image)} alt="" />
            <div className="card-body">
              <h3>{category.name}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {category.blurb}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {products.length > 0 ? (
        <>
          <div className="section-head">
            <h2>In the market now</h2>
          </div>
          <div className="grid grid-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
