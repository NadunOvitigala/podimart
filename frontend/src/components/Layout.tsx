import { NavLink, Outlet } from "react-router-dom";
import { SELLERCENTER_URL } from "../sites";

export function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <NavLink to="/" className="brand">
            <img src="/images/logo-podimart.png" alt="" />
            Podimart
          </NavLink>
          <nav className="nav">
            <NavLink to="/browse">Browse</NavLink>
            <a href={`${SELLERCENTER_URL}/login`}>Log in</a>
            <a href={`${SELLERCENTER_URL}/signup`} className="btn btn-clay">
              Open a free shop
            </a>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <strong className="serif">Podimart</strong>
          <p>
            A free shop page for home businesses. Buyers find homemade cakes,
            crafts, and more by city, then order on WhatsApp.
          </p>
        </div>
      </footer>
    </>
  );
}
