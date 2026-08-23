import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, displayPrice, mediaUrl } from "../api";
import { HowItWorks } from "../components/HowItWorks";
import { ProductCard } from "../components/ProductCard";
import { SELLERCENTER_URL } from "../sites";
import type { Category, Product } from "../types";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.categories(), api.products()])
      .then(([cats, items]) => {
        setCategories(cats);
        setProducts(items);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const featured = products.slice(0, 10);
  const more = products.slice(0, 12);

  return (
    <div className="wrap mall home-mall">
      <section className="home-hero">
        <img
          className="home-hero-img"
          src="/images/hero-marketplace.png"
          alt="Homemade cakes, crafts, flowers, and gifts"
        />
        <div className="home-hero-overlay">
          <p className="home-hero-kicker">Sri Lanka · Home businesses</p>
          <h1>Homemade goods from local makers</h1>
          <p className="home-hero-lede">
            Browse by category and province, then order on WhatsApp.
          </p>
          <div className="home-hero-actions">
            <Link className="btn btn-clay" to="/browse">
              Shop now
            </Link>
            <a className="btn btn-ghost-light" href={`${SELLERCENTER_URL}/signup`}>
              Open a free shop
            </a>
          </div>
        </div>
      </section>

      <section className="home-cats" aria-label="Categories">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <div className="home-cat-item skeleton-card" key={index}>
                <div className="skeleton home-cat-icon" />
                <div className="skeleton skeleton-line" />
              </div>
            ))
          : categories.map((category) => (
              <Link
                className="home-cat-item"
                key={category.id}
                to={`/browse?category=${category.id}`}
              >
                <span className="home-cat-icon">
                  <img src={mediaUrl(category.image)} alt="" loading="lazy" />
                </span>
                <span className="home-cat-name">{category.name}</span>
              </Link>
            ))}
      </section>

      <section className="mall-section home-rail-block">
        <div className="section-head">
          <h2>Featured</h2>
          <Link className="section-more" to="/browse">
            Shop More ›
          </Link>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {loading ? (
          <div className="home-product-rail">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="home-rail-card skeleton-card" key={index}>
                <div className="skeleton home-rail-thumb" />
                <div className="skeleton skeleton-line" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="home-product-rail">
            {featured.map((product) => (
              <Link className="home-rail-card" key={product.id} to={`/product/${product.id}`}>
                <img src={mediaUrl(product.image_url)} alt="" loading="lazy" />
                <span className="home-rail-name">{product.name}</span>
                <span className="home-rail-price">{displayPrice(product.price)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted empty-mall">
            New shops are joining every week. Browse categories or open your own shop.
          </p>
        )}
      </section>

      <HowItWorks />

      {more.length > 0 ? (
        <section className="mall-section">
          <div className="section-head">
            <h2>Just for you</h2>
            <Link className="section-more" to="/browse">
              Shop More ›
            </Link>
          </div>
          <div className="grid grid-mall home-just-grid">
            {more.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
