import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { EmptyState } from "../components/EmptyState";
import { LoadingGrid } from "../components/LoadingGrid";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
    api.cities().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .products({ category: category || undefined, city: city || undefined })
      .then(setProducts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
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
      if (min != null && !Number.isNaN(min) && price > 0 && price < min) return false;
      if (max != null && !Number.isNaN(max) && price > 0 && price > max) return false;
      if (min != null && !Number.isNaN(min) && min > 0 && price === 0) return false;
      return true;
    });
  }, [products, query, minPrice, maxPrice]);

  const title = useMemo(() => {
    const cat = categories.find((c) => c.id === category);
    if (query) return `Results for “${query}”`;
    if (cat && city) return `${cat.name} · ${city}`;
    if (cat) return cat.name;
    if (city) return `Makers in ${city}`;
    return "Marketplace";
  }, [categories, category, city, query]);

  const hasFilters = Boolean(category || city || query || minPrice || maxPrice);

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

  function clearFilters() {
    setParams({});
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
    <div className="wrap mall page-top">
      <div className="mall-section browse-head">
        <h1>{title}</h1>
        <p className="muted results-count">
          {loading ? "Loading listings…" : `${visible.length} listing${visible.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="mall-section browse-toolbar">
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
            </select>
          </label>
          {hasFilters ? (
            <button className="btn btn-outline filter-clear" type="button" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <LoadingGrid count={12} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No listings found"
          text="Try a different category, province, or search term."
          actionLabel="Browse all listings"
          actionTo="/browse"
        />
      ) : (
        <div className="grid grid-mall">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
