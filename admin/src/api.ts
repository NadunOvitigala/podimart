import type { AdminOrder, AdminProduct, AdminSeller, AdminStats, AdminUser } from "./types";

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
  adminLogin: (email: string, password: string) =>
    request<{ token: string; email: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  adminMe: () => request<{ email: string }>("/admin/me"),
  adminSellers: () => request<AdminSeller[]>("/admin/sellers"),
  adminProducts: (sellerId?: string) =>
    request<AdminProduct[]>(
      sellerId ? `/admin/products?seller_id=${encodeURIComponent(sellerId)}` : "/admin/products",
    ),
  deleteSeller: (id: string) =>
    request<{ ok: boolean }>(`/admin/sellers/${id}`, { method: "DELETE" }),
  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/admin/products/${id}`, { method: "DELETE" }),
  adminUsers: () => request<AdminUser[]>("/admin/users"),
  grantAdmin: (email: string) =>
    request<{ ok: boolean }>("/admin/users/grant", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  revokeAdmin: (email: string) =>
    request<{ ok: boolean }>(`/admin/users/${encodeURIComponent(email)}/admin`, {
      method: "DELETE",
    }),
  deleteUser: (email: string) =>
    request<{ ok: boolean }>(`/admin/users/${encodeURIComponent(email)}`, {
      method: "DELETE",
    }),
  adminOrders: () => request<AdminOrder[]>("/admin/orders"),
  adminStats: () => request<AdminStats>("/admin/stats"),
};

export function formatPrice(value: number): string {
  return `Rs ${value.toLocaleString("en-LK")}`;
}
