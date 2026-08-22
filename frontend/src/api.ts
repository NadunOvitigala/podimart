import type { Category, Product, Seller } from "./types";

const API = import.meta.env.VITE_API_URL || "/api";

export function mediaUrl(url: string | undefined): string {
  if (!url) return "/images/cat-crafts.png";
  if (url.startsWith("http") || url.startsWith("/images") || url.startsWith("/uploads")) {
    return url;
  }
  return url;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = "Something went wrong.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* keep default */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  categories: () => request<Category[]>("/categories"),
  cities: () => request<string[]>("/cities"),
  sellers: (city?: string) =>
    request<Seller[]>(city ? `/sellers?city=${encodeURIComponent(city)}` : "/sellers"),
  shop: (slug: string) =>
    request<{ seller: Seller; products: Product[] }>(`/sellers/${slug}`),
  products: (params: { category?: string; city?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.city) q.set("city", params.city);
    const suffix = q.toString() ? `?${q}` : "";
    return request<Product[]>(`/products${suffix}`);
  },
  product: (id: string) =>
    request<{ product: Product; seller: Seller | null }>(`/products/${id}`),
};

export function formatPrice(value: number): string {
  return `Rs ${Number(value || 0).toLocaleString("en-LK")}`;
}

export function displayPrice(value: number): string {
  if (!value || value <= 0) return "Contact for price";
  return formatPrice(value);
}

export function productCode(product: { id: string; code?: string }): string {
  if (product.code?.trim()) return product.code.trim().toUpperCase();
  return product.id ? `PM-${product.id.slice(0, 6).toUpperCase()}` : "";
}

export function whatsappLink(raw: string, message: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `94${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
