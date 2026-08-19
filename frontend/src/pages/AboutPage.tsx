import { Link } from "react-router-dom";
import { SELLERCENTER_URL } from "../sites";

export function AboutPage() {
  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 48 }}>
      <h1>About us</h1>
      <p className="lede">
        Podimart helps home businesses in Sri Lanka open a shop, list cakes and crafts, and
        reach buyers — without building a website.
      </p>
      <div className="panel form" style={{ marginTop: 24 }}>
        <h2>Marketplace</h2>
        <p>
          This is where buyers browse homemade goods by category and city, then contact the
          maker on WhatsApp, call, or email.
        </p>
        <p>
          Makers run their shop in{" "}
          <a className="text-link" href={SELLERCENTER_URL}>
            Seller Center
          </a>
          . Podimart does not take the sale.
        </p>
        <p>
          <Link className="btn btn-clay" to="/browse">
            Browse homemade goods
          </Link>
        </p>
      </div>
    </div>
  );
}
