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
  const item = product ? `${product.name} (Product ID ${code})` : "your work";
  const message = product
    ? `Hi ${seller.name}, I want to order Product ID ${code} (${product.name}) from Podimart. Is it available?`
    : `Hi ${seller.name}, I saw your work on Podimart. Is it available?`;
  const mail = `mailto:${seller.email_public}?subject=${encodeURIComponent(`Podimart order: ${item}`)}&body=${encodeURIComponent(message)}`;
  const onCover = variant === "cover";

  return (
    <div className={onCover ? "contact-cover" : "contact-row"}>
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
            Call {seller.phone}
          </a>
        ) : null}
        {seller.email_public ? (
          <a className={onCover ? "btn contact-ghost" : "btn btn-outline"} href={mail}>
            Email
          </a>
        ) : null}
      </div>
      {onCover ? (
        <p className="contact-meta">WhatsApp · Call · Email — you contact the maker directly</p>
      ) : (
        <>
          <p className="notice">
            Podimart is free. You contact the maker directly — we do not take
            payment on this site.
          </p>
          <Link className="text-link" to={`/shop/${seller.slug}`}>
            View {seller.name}
          </Link>
        </>
      )}
    </div>
  );
}
