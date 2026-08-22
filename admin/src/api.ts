import type { AuthResponse, Category, Product, Seller } from "./types";

const API = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "podimart_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function mediaUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("/images")) return url;
  if (url.startsWith("/uploads")) return url;
  return url;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
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
  product: (id: string) =>
    request<{ product: Product; seller: Seller | null }>(`/products/${id}`),
  signup: (body: Record<string, string>) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ seller: Seller; products: Product[] }>("/me"),
  updateMe: (body: Record<string, string>) =>
    request<Seller>("/me", { method: "PUT", body: JSON.stringify(body) }),
  createProduct: (body: Record<string, string | number>) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: string, body: Record<string, string | number>) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/products/${id}`, { method: "DELETE" }),
  upload: async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    return request<{ url: string }>("/media/upload", { method: "POST", body: data });
  },
};

export function formatPrice(value: number): string {
  return `Rs ${value.toLocaleString("en-LK")}`;
}
