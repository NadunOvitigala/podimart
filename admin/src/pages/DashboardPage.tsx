import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, formatPrice, mediaUrl } from "../api";
import { useAuth } from "../auth";
import type { AdminOrder, AdminProduct, AdminSeller, AdminUser } from "../types";
import { PUBLIC_URL } from "../sites";

type Tab = "overview" | "shops" | "listings" | "users" | "orders";
type DatePreset = "today" | "7d" | "month" | "all" | "custom";

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateKey(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function inDateRange(iso: string | undefined, from: string, to: string): boolean {
  const key = dateKey(iso);
  if (!key) return false;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

function formatDisplayDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function rangeLabel(from: string, to: string, preset: DatePreset): string {
  if (preset === "all" || (!from && !to)) return "All time";
  if (from === to) return formatDisplayDate(from);
  return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
}

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  const to = toDateInput(today);
  if (preset === "today") return { from: to, to };
  if (preset === "7d") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { from: toDateInput(start), to };
  }
  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateInput(start), to };
  }
  return { from: "", to: "" };
}

export function DashboardPage() {
  const { token, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [grantEmail, setGrantEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const monthRange = getPresetRange("month");
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [fromDate, setFromDate] = useState(monthRange.from);
  const [toDate, setToDate] = useState(monthRange.to);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([api.adminMe(), api.adminSellers(), api.adminProducts(), api.adminUsers(), api.adminOrders()])
      .then(([, nextSellers, nextProducts, nextUsers, nextOrders]) => {
        if (cancelled) return;
        setSellers(nextSellers);
        setProducts(nextProducts);
        setUsers(nextUsers);
        setOrders(nextOrders);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Could not load admin data.";
        if (message.includes("Admin access only") || message.includes("Please log in")) {
          logout();
        }
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const summary = useMemo(() => {
    const from = datePreset === "all" ? "" : fromDate;
    const to = datePreset === "all" ? "" : toDate;
    const filteredOrders = orders.filter((o) =>
      datePreset === "all" ? true : inDateRange(o.created_at, from, to),
    );
    const filteredShops = sellers.filter((s) =>
      datePreset === "all" ? true : inDateRange(s.created_at, from, to),
    );
    const filteredProducts = products.filter((p) =>
      datePreset === "all" ? true : inDateRange(p.created_at, from, to),
    );
    const revenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const quoteOrders = filteredOrders.filter((o) => !(Number(o.total) > 0)).length;
    return {
      orders: filteredOrders.length,
      revenue,
      quoteOrders,
      shops: filteredShops.length,
      products: filteredProducts.length,
      recent: filteredOrders.slice(0, 12),
      label: rangeLabel(from, to, datePreset),
    };
  }, [orders, sellers, products, datePreset, fromDate, toDate]);

  if (!token) return <Navigate to="/login" replace />;

  async function reload() {
    const [nextSellers, nextProducts, nextUsers, nextOrders] = await Promise.all([
      api.adminSellers(),
      api.adminProducts(),
      api.adminUsers(),
      api.adminOrders(),
    ]);
    setSellers(nextSellers);
    setProducts(nextProducts);
    setUsers(nextUsers);
    setOrders(nextOrders);
  }

  function applyPreset(preset: DatePreset) {
    setDatePreset(preset);
    const range = getPresetRange(preset);
    setFromDate(range.from);
    setToDate(range.to);
  }

  function onFromChange(value: string) {
    setDatePreset("custom");
    setFromDate(value);
  }

  function onToChange(value: string) {
    setDatePreset("custom");
    setToDate(value);
  }

  async function deleteSeller(id: string, name: string) {
    if (!window.confirm(`Delete shop "${name}" and all its listings? This cannot be undone.`)) {
      return;
    }
    setBusyId(id);
    setError("");
    try {
      await api.deleteSeller(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete shop.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!window.confirm(`Delete listing "${name}"? This cannot be undone.`)) {
      return;
    }
    setBusyId(id);
    setError("");
    try {
      await api.deleteProduct(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete listing.");
    } finally {
      setBusyId("");
    }
  }

  async function grantAdminByEmail(email: string) {
    const target = email.trim().toLowerCase();
    if (!target) return;
    setBusyId(`grant:${target}`);
    setError("");
    try {
      await api.grantAdmin(target);
      setGrantEmail("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not grant admin access.");
    } finally {
      setBusyId("");
    }
  }

  async function grantAdmin(event: FormEvent) {
    event.preventDefault();
    await grantAdminByEmail(grantEmail);
  }

  async function revokeAdmin(email: string) {
    if (!window.confirm(`Remove admin access for ${email}?`)) return;
    setBusyId(`revoke:${email}`);
    setError("");
    try {
      await api.revokeAdmin(email);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove admin access.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteUser(email: string) {
    if (
      !window.confirm(
        `Delete user ${email}? This removes their account, shop, listings, and admin access. This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusyId(`delete:${email}`);
    setError("");
    try {
      await api.deleteUser(email);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setBusyId("");
    }
  }

  async function confirmPendingUsers() {
    setBusyId("confirm-pending");
    setError("");
    try {
      const result = await api.confirmPendingUsers();
      await reload();
      if (result.count === 0) {
        setError("No unconfirmed users to approve.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm users.");
    } finally {
      setBusyId("");
    }
  }

  async function confirmUser(email: string) {
    setBusyId(`confirm:${email}`);
    setError("");
    try {
      await api.confirmUser(email);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm user.");
    } finally {
      setBusyId("");
    }
  }

  const adminCount = users.filter((user) => user.is_admin).length;
  const pendingCount = users.filter((user) => (user.status || "").toUpperCase() === "UNCONFIRMED").length;

  return (
    <div className="wrap admin-page">
      <div className="admin-head">
        <div>
          <h1>Marketplace admin</h1>
          <p className="lede">Platform overview, orders, shops, and users for podimart.lk.</p>
        </div>
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-label">Shops</span>
            <strong>{sellers.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Listings</span>
            <strong>{products.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Users</span>
            <strong>{users.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Admins</span>
            <strong>{adminCount}</strong>
          </div>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="admin-tabs">
        <button
          type="button"
          className={tab === "overview" ? "admin-tab is-active" : "admin-tab"}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={tab === "orders" ? "admin-tab is-active" : "admin-tab"}
          onClick={() => setTab("orders")}
        >
          Orders ({orders.length})
        </button>
        <button
          type="button"
          className={tab === "shops" ? "admin-tab is-active" : "admin-tab"}
          onClick={() => setTab("shops")}
        >
          Shops ({sellers.length})
        </button>
        <button
          type="button"
          className={tab === "listings" ? "admin-tab is-active" : "admin-tab"}
          onClick={() => setTab("listings")}
        >
          Listings ({products.length})
        </button>
        <button
          type="button"
          className={tab === "users" ? "admin-tab is-active" : "admin-tab"}
          onClick={() => setTab("users")}
        >
          Users ({users.length})
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : tab === "overview" ? (
        <div className="overview-page">
          <div className="date-filter-bar">
            <div className="date-filter-left">
              <span className="date-filter-title">Summary period</span>
              <div className="date-presets">
                {(
                  [
                    ["today", "Today"],
                    ["7d", "Last 7 days"],
                    ["month", "This month"],
                    ["all", "All time"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={datePreset === key ? "date-preset is-active" : "date-preset"}
                    onClick={() => applyPreset(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="date-filter-right">
              <label className="date-field">
                <span>From</span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => onFromChange(e.target.value)}
                  disabled={datePreset === "all"}
                />
              </label>
              <label className="date-field">
                <span>To</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => onToChange(e.target.value)}
                  disabled={datePreset === "all"}
                />
              </label>
            </div>
          </div>

          <p className="overview-range-note">
            Showing metrics for <strong>{summary.label}</strong>
          </p>

          <div className="overview-metrics">
            <div className="metric-card metric-primary">
              <span className="metric-label">Orders</span>
              <strong className="metric-value">{summary.orders}</strong>
              <span className="metric-hint">
                {summary.quoteOrders > 0
                  ? `${summary.quoteOrders} contact-for-price`
                  : "Placed in selected period"}
              </span>
            </div>
            <div className="metric-card metric-revenue">
              <span className="metric-label">Revenue</span>
              <strong className="metric-value">{formatPrice(summary.revenue)}</strong>
              <span className="metric-hint">Priced orders only</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">New shops</span>
              <strong className="metric-value">{summary.shops}</strong>
              <span className="metric-hint">{sellers.length} total shops</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">New listings</span>
              <strong className="metric-value">{summary.products}</strong>
              <span className="metric-hint">{products.length} total listings</span>
            </div>
          </div>

          <div className="overview-panel">
            <div className="overview-panel-head">
              <div>
                <h2>Orders in period</h2>
                <p>{summary.recent.length === 0 ? "No orders in this date range." : `${summary.orders} order${summary.orders === 1 ? "" : "s"} matched`}</p>
              </div>
              {orders.length > 0 ? (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setTab("orders")}>
                  View all orders
                </button>
              ) : null}
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Product</th>
                    <th>Shop</th>
                    <th>Buyer</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-cell">
                        No orders for {summary.label}.
                      </td>
                    </tr>
                  ) : (
                    summary.recent.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.reference}</strong>
                          <div className="cell-sub">
                            <span
                              className={
                                order.status === "pending" ? "status-pill pending" : "status-pill active"
                              }
                            >
                              {order.status || "pending"}
                            </span>
                          </div>
                        </td>
                        <td>
                          {order.product_name}
                          {order.variant_label ? <div className="cell-sub">{order.variant_label}</div> : null}
                        </td>
                        <td>{order.seller_name}</td>
                        <td>
                          {order.buyer_name}
                          <div className="cell-sub">{order.buyer_phone}</div>
                        </td>
                        <td className="metric-money">
                          {order.total > 0 ? formatPrice(order.total) : order.total_label}
                        </td>
                        <td>{formatDisplayDate(order.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === "orders" ? (
        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Product</th>
                  <th>Shop</th>
                  <th>Buyer</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">No orders yet.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.reference}</strong></td>
                      <td>
                        {order.product_name}
                        {order.variant_label ? <div className="cell-sub">{order.variant_label}</div> : null}
                        <div className="cell-sub">{order.product_code}</div>
                      </td>
                      <td>{order.seller_name}</td>
                      <td>
                        {order.buyer_name}
                        <div className="cell-sub">{order.buyer_phone}</div>
                        {order.buyer_email ? <div className="cell-sub">{order.buyer_email}</div> : null}
                      </td>
                      <td>{order.payment_method_label}</td>
                      <td>{order.total > 0 ? formatPrice(order.total) : order.total_label}</td>
                      <td>
                        <span className={order.status === "pending" ? "status-pill pending" : "status-pill active"}>
                          {order.status || "pending"}
                        </span>
                      </td>
                      <td>
                        {order.created_at ? formatDisplayDate(order.created_at) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "shops" ? (
        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Email</th>
                  <th>Province</th>
                  <th>Listings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No shops yet.
                    </td>
                  </tr>
                ) : (
                  sellers.map((seller) => (
                    <tr key={seller.id}>
                      <td>
                        <strong>{seller.name}</strong>
                        <div className="cell-sub">
                          <a href={`${PUBLIC_URL}/shop/${seller.slug}`} target="_blank" rel="noreferrer">
                            /shop/{seller.slug}
                          </a>
                        </div>
                      </td>
                      <td>{seller.email || "—"}</td>
                      <td>{seller.city}</td>
                      <td>{seller.product_count ?? 0}</td>
                      <td>
                        <div className="action-group">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyId === seller.id}
                            onClick={() => deleteSeller(seller.id, seller.name)}
                          >
                            Delete shop
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "listings" ? (
        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Shop</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No listings yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="listing-cell">
                          {product.image_url ? (
                            <img src={mediaUrl(product.image_url)} alt="" className="listing-thumb" />
                          ) : (
                            <span className="listing-thumb placeholder" aria-hidden="true" />
                          )}
                          <div>
                            <strong>{product.name}</strong>
                            <div className="cell-sub">{product.code || product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{product.seller_name}</strong>
                        <div className="cell-sub">{product.city}</div>
                      </td>
                      <td>{product.price > 0 ? formatPrice(product.price) : "Contact"}</td>
                      <td>
                        <span
                          className={
                            product.status === "disabled" ? "status-pill disabled" : "status-pill active"
                          }
                        >
                          {product.status === "disabled" ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyId === product.id}
                            onClick={() => deleteProduct(product.id, product.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-panel">
          <form className="admin-grant" onSubmit={grantAdmin}>
            <label>
              Grant admin by email
              <input
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="person@example.com"
                required
              />
            </label>
            <button className="btn btn-clay" type="submit" disabled={Boolean(busyId)}>
              Grant admin
            </button>
          </form>
          <p className="notice">
            Users need a Seller Center account first. They log in here with the same email and password.
          </p>
          {pendingCount > 0 ? (
            <div className="admin-grant">
              <p className="notice">
                {pendingCount} user{pendingCount === 1 ? "" : "s"} still unconfirmed from the old email-code flow.
              </p>
              <button
                type="button"
                className="btn btn-clay"
                disabled={busyId === "confirm-pending"}
                onClick={() => void confirmPendingUsers()}
              >
                {busyId === "confirm-pending" ? "Confirming…" : `Confirm all pending (${pendingCount})`}
              </button>
            </div>
          ) : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Shop</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.email}>
                      <td>
                        <strong>{user.email}</strong>
                        {user.name ? <div className="cell-sub">{user.name}</div> : null}
                      </td>
                      <td>
                        {user.shop_name ? (
                          <>
                            <strong>{user.shop_name}</strong>
                            {user.shop_slug ? (
                              <div className="cell-sub">/shop/{user.shop_slug}</div>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{user.status || "—"}</td>
                      <td>
                        {user.is_admin ? (
                          <span className="status-pill active">Admin</span>
                        ) : (
                          <span className="status-pill disabled">User</span>
                        )}
                      </td>
                      <td>
                        <div className="action-group">
                          {(user.status || "").toUpperCase() === "UNCONFIRMED" ? (
                            <button
                              type="button"
                              className="btn btn-clay btn-sm"
                              disabled={busyId === `confirm:${user.email}`}
                              onClick={() => void confirmUser(user.email)}
                            >
                              Confirm
                            </button>
                          ) : null}
                          {user.is_admin ? (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={busyId === `revoke:${user.email}`}
                              onClick={() => revokeAdmin(user.email)}
                            >
                              Remove admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={busyId === `grant:${user.email}`}
                              onClick={() => void grantAdminByEmail(user.email)}
                            >
                              Make admin
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyId === `delete:${user.email}`}
                            onClick={() => deleteUser(user.email)}
                          >
                            Delete user
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
