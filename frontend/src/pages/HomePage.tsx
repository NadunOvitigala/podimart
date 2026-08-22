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

  const featured = products.slice(0, 8);
  const more = products.slice(8, 20);

  return (
    <div className="wrap mall">
      <section className="promo-banner">
        <div className="promo-copy">
          <p className="eyebrow">Sri Lanka · Home businesses</p>
          <h1>Homemade goods from local makers</h1>
          <p className="lede">
            Browse cakes, crafts, food, and gifts by category and province, then order
            directly on WhatsApp.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-light" to="/browse">
              Shop now
            </Link>
            <a className="btn btn-ghost-light" href={`${SELLERCENTER_URL}/signup`}>
              Open a free shop
            </a>
          </div>
        </div>
        <img
          className="promo-photo"
          src="/images/hero-marketplace.png"
          alt="Homemade cakes, crafts, flowers, and gifts"
        />
      </section>

      <section className="mall-section">
        <div className="section-head">
          <h2>Categories</h2>
          <Link className="section-more" to="/browse">
            Shop all
          </Link>
        </div>
        {loading ? (
          <div className="cat-tiles">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="cat-tile skeleton-card" key={index}>
                <div className="skeleton cat-tile-img" />
                <div className="skeleton skeleton-line" />
              </div>
            ))}
          </div>
        ) : (
          <div className="cat-tiles">
            {categories.map((category) => (
              <Link
                className="cat-tile"
                key={category.id}
                to={`/browse?category=${category.id}`}
              >
                <img src={mediaUrl(category.image)} alt="" loading="lazy" />
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mall-section">
        <div className="section-head">
          <h2>Featured listings</h2>
          <Link className="section-more" to="/browse">
            Shop all
          </Link>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {loading ? (
          <div className="cat-tiles listing-tiles">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="cat-tile skeleton-card" key={index}>
                <div className="skeleton cat-tile-img" />
                <div className="skeleton skeleton-line" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="cat-tiles listing-tiles">
            {featured.map((product) => (
              <Link
                className="cat-tile"
                key={product.id}
                to={`/product/${product.id}`}
              >
                <img
                  src={mediaUrl(product.image_url)}
                  alt=""
                  loading="lazy"
                />
                <span className="listing-tile-name">{product.name}</span>
                <span className="listing-tile-price">{displayPrice(product.price)}</span>
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
              Shop all
            </Link>
          </div>
          <div className="grid grid-mall">
            {more.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
