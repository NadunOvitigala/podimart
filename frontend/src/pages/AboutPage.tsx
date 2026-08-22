import { Link } from "react-router-dom";
import { SELLERCENTER_URL } from "../sites";

export function AboutPage() {
  return (
    <div className="wrap page-top page-narrow">
      <h1>About podimart.lk</h1>
      <p className="lede">
        We help home businesses in Sri Lanka reach buyers without building a website.
        Makers list for free. Buyers browse and contact sellers directly.
      </p>

      <div className="panel">
        <h2>For buyers</h2>
        <p>
          Browse homemade cakes, crafts, food, flowers, and gifts by category and province.
          When you find something you like, contact the maker on WhatsApp, call, or email.
        </p>
        <p>
          <Link className="btn btn-clay" to="/browse">
            Browse marketplace
          </Link>
        </p>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>For makers</h2>
        <p>
          Open a free shop on Seller Center, add photos and prices, and appear on the
          marketplace.
        </p>
        <p>
          <a className="btn btn-outline" href={`${SELLERCENTER_URL}/signup`}>
            Open a free shop
          </a>
        </p>
      </div>
    </div>
  );
}
