import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { ProductCard } from "../components/ProductCard";
import type { Category, Product } from "../types";

const PRICE_RANGES = [
  { id: "", label: "Any price" },
  { id: "0-1000", min: 0, max: 1000, label: "Under Rs 1,000" },
  { id: "1000-5000", min: 1000, max: 5000, label: "Rs 1,000 – 5,000" },
  { id: "5000-15000", min: 5000, max: 15000, label: "Rs 5,000 – 15,000" },
  { id: "15000+", min: 15000, max: undefined, label: "Over Rs 15,000" },
];

function rangeId(min: string, max: string): string {
  return (
    PRICE_RANGES.find((range) => {
      if (!range.id) return !min && !max;
      const lo = range.min == null ? "" : String(range.min);
      const hi = range.max == null ? "" : String(range.max);
      return lo === min && hi === max;
    })?.id ?? "custom"
  );
}

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const query = params.get("q") || "";
  const minPrice = params.get("min") || "";
  const maxPrice = params.get("max") || "";
  const [draft, setDraft] = useState(query);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(query);
  }, [query]);

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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    return products.filter((product) => {
      if (needle) {
        const hay = [
          product.name,
          product.description,
          product.seller_name,
          product.city,
          product.category,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      const price = Number(product.price || 0);
      if (min != null && !Number.isNaN(min) && price < min) return false;
      if (max != null && !Number.isNaN(max) && price > max) return false;
      return true;
    });
  }, [products, query, minPrice, maxPrice]);

  const title = useMemo(() => {
    const cat = categories.find((c) => c.id === category);
    if (query) return `Results for “${query}”`;
    if (cat && city) return `${cat.name} in ${city}`;
    if (cat) return cat.name;
    if (city) return `Makers in ${city}`;
    return "Marketplace";
  }, [categories, category, city, query]);

  function update(next: Record<string, string | undefined>) {
    const merged = new URLSearchParams(params);
    const values = {
      category,
      city,
      q: query,
      min: minPrice,
      max: maxPrice,
      ...next,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    setParams(merged);
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    update({ q: draft.trim() });
  }

  function onPriceRange(id: string) {
    if (id === "custom") return;
    const range = PRICE_RANGES.find((item) => item.id === id);
    if (!range || !range.id) {
      update({ min: "", max: "" });
      return;
    }
    update({
      min: range.min == null ? "" : String(range.min),
      max: range.max == null ? "" : String(range.max),
    });
  }

  return (
    <div className="wrap" style={{ paddingTop: 28 }}>
      <h1>{title}</h1>
      <p className="lede">
        Search listings, then narrow by category, province, and price.
      </p>

      <form className="search-bar" onSubmit={onSearch} role="search">
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search cakes, crafts, shops, or a province"
            aria-label="Search marketplace"
          />
        </label>
        <button className="btn btn-clay" type="submit">
          Search
        </button>
      </form>

      <div className="filters">
        <label className="filter-field">
          Category
          <select value={category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Province
          <select value={city} onChange={(e) => update({ city: e.target.value })}>
            <option value="">All provinces</option>
            {cities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Price
          <select value={rangeId(minPrice, maxPrice)} onChange={(e) => onPriceRange(e.target.value)}>
            {PRICE_RANGES.map((item) => (
              <option key={item.id || "any"} value={item.id}>
                {item.label}
              </option>
            ))}
            {rangeId(minPrice, maxPrice) === "custom" ? (
              <option value="custom">Custom range</option>
            ) : null}
          </select>
        </label>
        <label className="filter-field filter-price">
          Min (Rs)
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={minPrice}
            onChange={(e) => update({ min: e.target.value })}
          />
        </label>
        <label className="filter-field filter-price">
          Max (Rs)
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => update({ max: e.target.value })}
          />
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}
      <p className="muted" style={{ margin: "0 0 16px" }}>
        {visible.length} listing{visible.length === 1 ? "" : "s"}
      </p>
      {visible.length === 0 ? (
        <div className="empty">No listings match this search. Try another word or price.</div>
      ) : (
        <div className="grid grid-4">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
