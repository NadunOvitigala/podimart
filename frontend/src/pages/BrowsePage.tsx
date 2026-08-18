import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { ProductCard } from "../components/ProductCard";
import type { Category, Product } from "../types";

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
    api.cities().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    setError("");
    api
      .products({ category: category || undefined, city: city || undefined })
      .then(setProducts)
      .catch((err: Error) => setError(err.message));
  }, [category, city]);

  const title = useMemo(() => {
    const cat = categories.find((c) => c.id === category);
    if (cat && city) return `${cat.name} in ${city}`;
    if (cat) return cat.name;
    if (city) return `Makers in ${city}`;
    return "Browse homemade goods";
  }, [categories, category, city]);

  function update(next: { category?: string; city?: string }) {
    const merged = new URLSearchParams(params);
    const cat = next.category ?? category;
    const loc = next.city ?? city;
    if (cat) merged.set("category", cat);
    else merged.delete("category");
    if (loc) merged.set("city", loc);
    else merged.delete("city");
    setParams(merged);
  }

  return (
    <div className="wrap" style={{ paddingTop: 28 }}>
      <h1>{title}</h1>
      <p className="lede">
        Choose a category and a city. Contact the maker when you find something
        you like.
      </p>
      <div className="filters">
        <select value={category} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={city} onChange={(e) => update({ city: e.target.value })}>
          <option value="">All cities</option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {products.length === 0 ? (
        <div className="empty">No listings yet for this filter. Try another city.</div>
      ) : (
        <div className="grid grid-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
