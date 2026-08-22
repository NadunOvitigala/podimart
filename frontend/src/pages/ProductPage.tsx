import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, displayPrice, mediaUrl, productCode } from "../api";
import { Breadcrumb } from "../components/Breadcrumb";
import { ContactActions } from "../components/ContactActions";
import { LoadingGrid } from "../components/LoadingGrid";
import type { Product, Seller } from "../types";

function listingPhotos(product: Product): string[] {
  const urls = (product.image_urls ?? []).filter(Boolean);
  if (product.image_url && !urls.includes(product.image_url)) {
    return [product.image_url, ...urls];
  }
  return urls.length ? urls : product.image_url ? [product.image_url] : [];
}

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
};

function paymentLabels(product: Product): string[] {
  return (product.payment_methods ?? [])
    .map((id) => PAYMENT_LABELS[id] || id)
    .filter(Boolean);
}

export function ProductPage() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [variantId, setVariantId] = useState("");

  useEffect(() => {
    api
      .product(id)
      .then((data) => {
        setProduct(data.product);
        setSeller(data.seller);
        setActive(0);
        setZoomed(false);
        setVariantId(data.product.variants?.[0]?.id || "");
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const photos = useMemo(() => (product ? listingPhotos(product) : []), [product]);
  const current = photos[active] || photos[0] || "";
  const payments = useMemo(() => (product ? paymentLabels(product) : []), [product]);
  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((item) => item.id === variantId) || variants[0];
  const displayAmount = selectedVariant ? selectedVariant.price : product?.price || 0;
  const orderHref = selectedVariant
    ? `/order/${product?.id}?variant=${encodeURIComponent(selectedVariant.id)}`
    : `/order/${product?.id}`;

  useEffect(() => {
    if (!zoomed) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoomed]);

  if (error) {
    return (
      <div className="wrap page-top">
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="wrap page-top">
        <LoadingGrid count={1} />
      </div>
    );
  }

  return (
    <div className="wrap page-top">
      <Breadcrumb
        items={[
          { label: "Marketplace", to: "/browse" },
          ...(seller ? [{ label: seller.name, to: `/shop/${seller.slug}` }] : []),
          { label: product.name },
        ]}
      />
      <div className="product-layout">
        <div className="product-gallery">
          {current ? (
            <div className="product-photo-wrap">
              <button
                type="button"
                className="product-photo-btn"
                onClick={() => setZoomed(true)}
                aria-label="Zoom product photo"
              >
                <img
                  className="product-photo"
                  src={mediaUrl(current)}
                  alt={product.name}
                />
                <span className="zoom-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>
          ) : (
            <div className="product-photo product-photo-empty">Photo coming soon</div>
          )}
          {photos.length > 1 ? (
            <div className="product-thumbs">
              {photos.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  className={index === active ? "is-active" : ""}
                  onClick={() => setActive(index)}
                >
                  <img src={mediaUrl(url)} alt="" />
                </button>
              ))}
            </div>
          ) : null}
          {seller ? (
            <div className="panel contact-panel-compact">
              <ContactActions seller={seller} product={product} />
            </div>
          ) : null}
        </div>
        <div>
          <span className="chip">{product.city}</span>
          <h1>{product.name}</h1>
          <p className="price product-price">{displayPrice(displayAmount)}</p>
          {variants.length > 0 ? (
            <div className="variant-picker">
              <div className="variant-picker-label">
                <span>{product.variation_type_label || "Option"}</span>
                {selectedVariant ? <strong>{selectedVariant.label}</strong> : null}
              </div>
              <div className="variant-chips">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={
                      selectedVariant?.id === variant.id
                        ? "variant-chip is-selected"
                        : "variant-chip"
                    }
                    onClick={() => setVariantId(variant.id)}
                  >
                    {variant.label}
                    {selectedVariant?.id === variant.id ? (
                      <span className="variant-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {product.description ? <p className="product-desc">{product.description}</p> : null}
          <dl className="product-facts">
            {product.lead_time ? (
              <>
                <dt>Lead time</dt>
                <dd>{product.lead_time}</dd>
              </>
            ) : null}
            <dt>Seller</dt>
            <dd>
              {seller ? (
                <Link className="text-link" to={`/shop/${seller.slug}`}>
                  {product.seller_name}
                </Link>
              ) : (
                product.seller_name
              )}
            </dd>
            <dt>Reference</dt>
            <dd>
              <span className="ref-badge">{productCode(product)}</span>
              <span className="muted ref-hint"> Quote this when you contact the seller</span>
            </dd>
            {payments.length > 0 ? (
              <>
                <dt>Payment</dt>
                <dd>
                  <ul className="payment-list">
                    {payments.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                </dd>
              </>
            ) : null}
          </dl>
          {seller ? (
            <div className="order-now order-now-inline">
              <Link className="btn btn-clay btn-order" to={orderHref}>
                Order now
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      {seller ? (
        <div className="product-buy-bar">
          <div className="product-buy-meta">
            <span className="product-buy-label">Total</span>
            <strong className="product-buy-price">{displayPrice(displayAmount)}</strong>
          </div>
          <Link className="btn btn-clay product-buy-cta" to={orderHref}>
            Order now
          </Link>
        </div>
      ) : null}
      {zoomed && current ? (
        <div
          className="zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product photo"
          onClick={() => setZoomed(false)}
        >
          <button type="button" className="zoom-close" aria-label="Close zoom">
            ×
          </button>
          <img src={mediaUrl(current)} alt={product.name} onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
}
