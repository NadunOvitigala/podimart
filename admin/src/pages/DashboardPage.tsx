import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, formatPrice, mediaUrl } from "../api";
import { useAuth } from "../auth";
import type { AdminProduct, AdminSeller, AdminUser } from "../types";
import { PUBLIC_URL } from "../sites";

type Tab = "shops" | "listings" | "users";

export function DashboardPage() {
  const { token, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("shops");
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [grantEmail, setGrantEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([api.adminMe(), api.adminSellers(), api.adminProducts(), api.adminUsers()])
      .then(([, nextSellers, nextProducts, nextUsers]) => {
        if (cancelled) return;
        setSellers(nextSellers);
        setProducts(nextProducts);
        setUsers(nextUsers);
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

  if (!token) return <Navigate to="/login" replace />;

  async function reload() {
    const [nextSellers, nextProducts, nextUsers] = await Promise.all([
      api.adminSellers(),
      api.adminProducts(),
      api.adminUsers(),
    ]);
    setSellers(nextSellers);
    setProducts(nextProducts);
    setUsers(nextUsers);
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

  const adminCount = users.filter((user) => user.is_admin).length;

  return (
    <div className="wrap admin-page">
      <div className="admin-head">
        <div>
          <h1>Marketplace admin</h1>
          <p className="lede">Manage shops, listings, and users across podimart.lk.</p>
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
