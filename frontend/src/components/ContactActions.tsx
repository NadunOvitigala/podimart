import { Link } from "react-router-dom";
import { productCode, whatsappLink } from "../api";
import type { Product, Seller } from "../types";

export function ContactActions({
  seller,
  product,
  variant = "panel",
}: {
  seller: Seller;
  product?: Product;
  variant?: "panel" | "cover";
}) {
  const code = product ? productCode(product) : "";
  const item = product ? `${product.name} (Ref ${code})` : "your shop";
  const message = product
    ? `Hi ${seller.name}, I would like to order ${product.name} (Ref ${code}) from podimart.lk. Is it available?`
    : `Hi ${seller.name}, I found your shop on podimart.lk and would like to enquire.`;
  const mail = `mailto:${seller.email_public}?subject=${encodeURIComponent(`podimart.lk — ${item}`)}&body=${encodeURIComponent(message)}`;
  const onCover = variant === "cover";

  return (
    <div className={onCover ? "contact-cover" : "contact-row"}>
      {!onCover ? <h3 className="contact-title">Contact the seller</h3> : null}
      <div className="contact-actions">
        {seller.whatsapp ? (
          <a
            className="btn btn-clay"
            href={whatsappLink(seller.whatsapp, message)}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        ) : null}
        {seller.phone ? (
          <a className={onCover ? "btn contact-ghost" : "btn btn-outline"} href={`tel:${seller.phone}`}>
            Call
          </a>
        ) : null}
        {seller.email_public ? (
          <a className={onCover ? "btn contact-ghost" : "btn btn-outline"} href={mail}>
            Email
          </a>
        ) : null}
      </div>
      {onCover ? (
        <p className="contact-meta">Free to contact · You pay the maker directly</p>
      ) : (
        <p className="notice">podimart.lk connects buyers and home businesses.</p>
      )}
    </div>
  );
}
