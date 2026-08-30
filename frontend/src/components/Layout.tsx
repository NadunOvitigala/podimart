import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api";
import { useProductActions } from "../productActions";
import { SELLERCENTER_URL } from "../sites";
import type { Category } from "../types";
import { HeaderSearch } from "./HeaderSearch";

export function Layout() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { actions: productActions } = useProductActions();
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

  const productMenu = productActions ? (
    <>
      <p className="nav-owner-label">This product</p>
      <Link className="nav-quiet" to={productActions.shopHref} onClick={closeMenu}>
        Shop · {productActions.shopLabel}
      </Link>
      {productActions.chatHref ? (
        <a
          className="nav-quiet"
          href={productActions.chatHref}
          target="_blank"
          rel="noreferrer"
          onClick={closeMenu}
        >
          Chat on WhatsApp
        </a>
      ) : null}
      <Link className="btn btn-clay nav-cta" to={productActions.orderHref} onClick={closeMenu}>
        Order now
      </Link>
    </>
  ) : null;

  const siteMenuLinks = (
    <>
      <p className="nav-owner-label">Browse</p>
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? "nav-quiet active" : "nav-quiet")}
        onClick={closeMenu}
      >
        Home
      </NavLink>
      <NavLink
        to="/browse"
        className={({ isActive }) => (isActive ? "nav-quiet active" : "nav-quiet")}
        onClick={closeMenu}
      >
        Marketplace
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
        <span className="nav-cta-short">Open shop</span>
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
            {siteMenuLinks}
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
        <nav className="more-sheet-nav">
          {productMenu}
          {siteMenuLinks}
        </nav>
      </div>

      <main className="site-main">
        <Outlet />
      </main>
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
