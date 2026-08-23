import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOutCognito } from "../cognito";
import { useAuth } from "../auth";
import { PUBLIC_URL, SELLERCENTER_URL } from "../sites";

export function Layout() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const loggedIn = Boolean(token);

  function onLogout() {
    signOutCognito();
    logout();
    navigate("/login");
  }

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-row">
          <span>Platform admin for podimart.lk</span>
          <span className="topbar-hide">Shops · Listings · Users</span>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <NavLink to={loggedIn ? "/dashboard" : "/login"} className="brand">
            <img src="/images/logo-icon.png" alt="" />
            <span className="brand-text">
              <span className="brand-name">Podimart Admin</span>
              <span className="brand-mark">podimart.lk</span>
            </span>
          </NavLink>
          <nav className="nav">
            <a href={PUBLIC_URL} target="_blank" rel="noreferrer">
              Marketplace
            </a>
            <a href={SELLERCENTER_URL} target="_blank" rel="noreferrer">
              Seller Center
            </a>
            {loggedIn ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <button className="btn btn-ghost" type="button" onClick={onLogout}>
                  Log out
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn btn-clay">
                Log in
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap footer-inner">
          <strong>Podimart Admin</strong>
          <p>Manage shops, listings, and users on podimart.lk.</p>
        </div>
      </footer>
    </>
  );
}
