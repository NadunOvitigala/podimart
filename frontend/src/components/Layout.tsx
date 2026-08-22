import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api";
import { SELLERCENTER_URL } from "../sites";
import type { Category } from "../types";
import { HeaderSearch } from "./HeaderSearch";

export function Layout() {
  const [categories, setCategories] = useState<Category[]>([]);
  const location = useLocation();
  const activeCategory = new URLSearchParams(location.search).get("category");

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
  }, []);

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
          <NavLink to="/" className="brand">
            <img src="/images/logo-icon.png" alt="" />
            <span className="brand-text">
              <span className="brand-name">podimart.lk</span>
            </span>
          </NavLink>
          <HeaderSearch />
          <nav className="nav">
            <NavLink
              to="/browse"
              className={({ isActive }) => (isActive ? "nav-quiet active" : "nav-quiet")}
            >
              Browse
            </NavLink>
            <a className="btn btn-clay" href={`${SELLERCENTER_URL}/signup`}>
              Open a free shop
            </a>
          </nav>
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
      <main>
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
            <a href={`${SELLERCENTER_URL}/signup`}>Open a free shop</a>
            <a href={SELLERCENTER_URL}>Seller Center</a>
          </div>
          <div>
            <h3>Help</h3>
            <NavLink to="/about">About us</NavLink>
            <NavLink to="/contact">Contact us</NavLink>
            <a href="mailto:hello@podimart.lk">hello@podimart.lk</a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <p>© {new Date().getFullYear()} podimart.lk · Free listings</p>
        </div>
      </footer>
    </>
  );
}
