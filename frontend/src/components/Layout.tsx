import { NavLink, Outlet } from "react-router-dom";
import { SELLERCENTER_URL } from "../sites";

export function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <NavLink to="/" className="brand">
            <img src="/images/logo-podimart.png" alt="" />
            <span className="brand-text">
              <span className="brand-name">podimart.lk</span>
              <span className="brand-mark">Marketplace</span>
            </span>
          </NavLink>
          <nav className="nav">
            <div className="nav-links">
              <NavLink to="/browse" className="btn btn-clay">
                Marketplace
              </NavLink>
              <NavLink to="/about">About us</NavLink>
              <NavLink to="/contact">Contact us</NavLink>
            </div>
            <div className="nav-actions">
              <a href={`${SELLERCENTER_URL}/signup`}>Open a free shop</a>
            </div>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div>
            <NavLink to="/" className="brand footer-brand">
              <img src="/images/logo-podimart.png" alt="" />
              <span className="brand-text">
                <span className="brand-name">podimart.lk</span>
                <span className="brand-mark">Marketplace</span>
              </span>
            </NavLink>
            <p>
              A marketplace for home businesses. Find homemade cakes, crafts,
              and more by province, then order on WhatsApp.
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
          <p>© {new Date().getFullYear()} podimart.lk. Free listings. We do not take payment.</p>
        </div>
      </footer>
    </>
  );
}
