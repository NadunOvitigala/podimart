import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api";
import { SELLERCENTER_URL } from "../sites";
import type { Category } from "../types";
import { HeaderSearch } from "./HeaderSearch";

export function Layout() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const activeCategory = new URLSearchParams(location.search).get("category");

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.body.classList.add("menu-open");
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const sellerLoginUrl = `${SELLERCENTER_URL}/login`;
  const sellerSignupUrl = `${SELLERCENTER_URL}/signup`;

  const menuLinks = (
    <>
      <NavLink
        to="/browse"
        className={({ isActive }) => (isActive ? "nav-quiet active" : "nav-quiet")}
        onClick={closeMenu}
      >
        Browse marketplace
      </NavLink>
      <NavLink
        to="/about"
        className={({ isActive }) => (isActive ? "nav-quiet active" : "nav-quiet")}
        onClick={closeMenu}
      >
        About us
      </NavLink>
      <NavLink
        to="/contact"
        className={({ isActive }) => (isActive ? "nav-quiet active" : "nav-quiet")}
        onClick={closeMenu}
      >
        Contact us
      </NavLink>
      <p className="nav-owner-label">For shop owners</p>
      <a className="nav-quiet nav-login" href={sellerLoginUrl} onClick={closeMenu}>
        Log in
      </a>
      <a className="btn btn-clay nav-cta" href={sellerSignupUrl} onClick={closeMenu}>
        <span className="nav-cta-full">Open a free shop</span>
        <span className="nav-cta-short">Open a free shop</span>
      </a>
    </>
  );

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-row">
          <span>Free listings for home businesses across Sri Lanka</span>
          <span className="topbar-hide">Order on WhatsApp</span>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <NavLink to="/" className="brand" onClick={closeMenu}>
            <img src="/images/logo-icon.png" alt="" />
            <span className="brand-text">
              <span className="brand-name">podimart.lk</span>
            </span>
          </NavLink>
          <HeaderSearch />
          <nav id="site-nav" className="nav nav-desktop">
            {menuLinks}
          </nav>
          <button
            type="button"
            className={menuOpen ? "nav-toggle is-open" : "nav-toggle"}
            aria-expanded={menuOpen}
            aria-controls="site-more"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-bars" aria-hidden="true" />
          </button>
        </div>
        {categories.length > 0 ? (
          <div className="cat-strip">
            <div className="wrap cat-strip-row">
              {categories.map((category) => (
                <NavLink
                  key={category.id}
                  to={`/browse?category=${category.id}`}
                  className={
                    location.pathname === "/browse" && activeCategory === category.id
                      ? "cat-strip-link active"
                      : "cat-strip-link"
                  }
                >
                  {category.name}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="more-sheet-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}
      <div
        id="site-more"
        className={menuOpen ? "more-sheet is-open" : "more-sheet"}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
        aria-label="Menu"
      >
        <div className="more-sheet-head">
          <h2>Menu</h2>
          <button type="button" className="more-sheet-close" onClick={closeMenu}>
            Close
          </button>
        </div>
        <nav className="more-sheet-nav">{menuLinks}</nav>
      </div>

      <main className="site-main">
        <Outlet />
      </main>
      <nav className="mobile-tabbar" aria-label="Primary">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "tabbar-item is-active" : "tabbar-item")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/browse"
          className={({ isActive }) => (isActive ? "tabbar-item is-active" : "tabbar-item")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>Categories</span>
        </NavLink>
        <a className="tabbar-item" href={sellerLoginUrl}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M15 12H3m0 0l3-3m-3 3l3 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Log in</span>
        </a>
        <a className="tabbar-item tabbar-primary" href={sellerSignupUrl}>
          <span className="tabbar-fab" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span>Sell</span>
        </a>
      </nav>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div>
            <NavLink to="/" className="brand footer-brand">
              <img src="/images/logo-icon.png" alt="" />
              <span className="brand-text">
                <span className="brand-name">podimart.lk</span>
              </span>
            </NavLink>
            <p>
              Sri Lanka&apos;s marketplace for home businesses. Browse homemade goods by
              province and contact makers on WhatsApp.
            </p>
          </div>
          <div>
            <h3>Marketplace</h3>
            <NavLink to="/browse">Browse listings</NavLink>
            <NavLink to="/browse?category=bakery">Cake &amp; Bakery</NavLink>
            <NavLink to="/browse?category=crafts">Hand Crafts</NavLink>
            <NavLink to="/browse?category=gifts">Gifts</NavLink>
            <NavLink to="/browse?category=fashion">Fashion</NavLink>
          </div>
          <div>
            <h3>For makers</h3>
            <a href={sellerLoginUrl}>Log in to your shop</a>
            <a href={sellerSignupUrl}>Open a free shop</a>
            <a href={SELLERCENTER_URL}>Seller Center</a>
          </div>
          <div>
            <h3>Help</h3>
            <NavLink to="/about">About us</NavLink>
            <NavLink to="/contact">Contact us</NavLink>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <p>© {new Date().getFullYear()} podimart.lk · Free listings</p>
        </div>
      </footer>
    </>
  );
}
