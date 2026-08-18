import { Link } from "react-router-dom";
import { whatsappLink } from "../api";
import type { Product, Seller } from "../types";

export function ContactActions({
  seller,
  product,
}: {
  seller: Seller;
  product?: Product;
}) {
  const item = product ? product.name : "your work";
  const message = `Hi ${seller.name}, I saw ${item} on Podimart. Is it available?`;
  const mail = `mailto:${seller.email_public}?subject=${encodeURIComponent(`Podimart order: ${item}`)}&body=${encodeURIComponent(message)}`;

  return (
    <div className="contact-row">
      {seller.whatsapp ? (
        <a
          className="btn btn-leaf"
          href={whatsappLink(seller.whatsapp, message)}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp {seller.name}
        </a>
      ) : null}
      {seller.phone ? (
        <a className="btn btn-ghost" href={`tel:${seller.phone}`}>
          Call {seller.phone}
        </a>
      ) : null}
      {seller.email_public ? (
        <a className="btn btn-ghost" href={mail}>
          Email the seller
        </a>
      ) : null}
      <p className="notice">
        Podimart is free. You contact the maker directly — we do not take
        payment on this site.
      </p>
      <Link to={`/shop/${seller.slug}`}>View {seller.name}</Link>
    </div>
  );
}
