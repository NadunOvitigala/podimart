import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, displayPrice, mediaUrl, productCode, whatsappLink } from "../api";
import { Breadcrumb } from "../components/Breadcrumb";
import { LoadingGrid } from "../components/LoadingGrid";
import { useRegisterProductActions } from "../productActions";
import type { Category, Product, Seller } from "../types";

function listingPhotos(product: Product): string[] {
  const urls = (product.image_urls ?? []).filter(Boolean);
  if (product.image_url && !urls.includes(product.image_url)) {
    return [product.image_url, ...urls];
  }
  return urls.length ? urls : product.image_url ? [product.image_url] : [];
}

type MediaItem = { type: "image" | "video"; url: string };

function listingMedia(product: Product): MediaItem[] {
  const photos = listingPhotos(product).map((url) => ({ type: "image" as const, url }));
  const videos = (product.video_urls ?? [])
    .filter(Boolean)
    .map((url) => ({ type: "video" as const, url }));
  return [...photos, ...videos];
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

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      className={open ? "product-row-chevron is-open" : "product-row-chevron"}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProductPage() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [variantId, setVariantId] = useState("");
  const [openRows, setOpenRows] = useState({ options: true, details: true });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    api
      .product(id)
      .then((data) => {
        setProduct(data.product);
        setSeller(data.seller);
        setActive(0);
        setZoomed(false);
        setVariantId(data.product.variants?.[0]?.id || "");
        setOpenRows({ options: true, details: true });
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const media = useMemo(() => (product ? listingMedia(product) : []), [product]);
  const currentItem = media[active] || media[0];
  const current = currentItem?.type === "image" ? currentItem.url : "";
  const payments = useMemo(() => (product ? paymentLabels(product) : []), [product]);
  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((item) => item.id === variantId) || variants[0];
  const displayAmount = selectedVariant ? selectedVariant.price : product?.price || 0;
  const orderHref = selectedVariant
    ? `/order/${product?.id}?variant=${encodeURIComponent(selectedVariant.id)}`
    : `/order/${product?.id}`;
  const code = product ? productCode(product) : "";
  const categoryMeta = useMemo(() => {
    if (!product?.category) return null;
    const category = categories.find((item) => item.id === product.category);
    const subcategory = (category?.subcategories || []).find(
      (item) => item.id === product.subcategory,
    );
    return {
      id: product.category,
      name: category?.name || product.category,
      subcategoryName: subcategory?.name || product.subcategory || "",
    };
  }, [categories, product]);
  const whatsappMessage = product
    ? `Hi ${seller?.name || product.seller_name}, I would like to order ${product.name} (Ref ${code}) from podimart.lk. Is it available?`
    : "";
  const chatHref =
    seller?.whatsapp && product
      ? whatsappLink(seller.whatsapp, whatsappMessage)
      : undefined;

  useRegisterProductActions(
    product && seller
      ? {
          shopHref: `/shop/${seller.slug}`,
          shopLabel: product.seller_name || seller.name,
          chatHref,
          orderHref,
        }
      : null,
  );

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

  function onCarouselScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    const width = track.clientWidth || 1;
    const index = Math.round(track.scrollLeft / width);
    if (index !== active) setActive(index);
  }

  function scrollToSlide(index: number) {
    setActive(index);
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  function toggleRow(key: "options" | "details") {
    setOpenRows((current) => ({ ...current, [key]: !current[key] }));
  }

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
    <div className="wrap page-top product-page">
      <Breadcrumb
        items={[
          { label: "Marketplace", to: "/browse" },
          ...(categoryMeta
            ? [
                {
                  label: categoryMeta.name,
                  to: `/browse?category=${encodeURIComponent(categoryMeta.id)}`,
                },
              ]
            : []),
          ...(seller ? [{ label: seller.name, to: `/shop/${seller.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="product-layout product-mall">
        <div className="product-gallery">
          {media.length > 0 ? (
            <>
              <div className="product-carousel-desktop">
                <div className="product-photo-wrap">
                  {currentItem?.type === "video" ? (
                    <video
                      className="product-photo product-video"
                      src={mediaUrl(currentItem.url)}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <button
                      type="button"
                      className="product-photo-btn"
                      onClick={() => setZoomed(true)}
                      aria-label="Zoom product photo"
                    >
                      <img className="product-photo" src={mediaUrl(current)} alt={product.name} />
                      <span className="zoom-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                          <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M11 8v6M8 11h6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={trackRef}
                className="product-carousel-track"
                onScroll={onCarouselScroll}
              >
                {media.map((item, index) => (
                  <div key={`${item.type}-${item.url}`} className="product-carousel-slide">
                    {item.type === "video" ? (
                      <video
                        src={mediaUrl(item.url)}
                        controls
                        playsInline
                        preload="metadata"
                        aria-label={`Product video ${index + 1}`}
                      />
                    ) : (
                      <button
                        type="button"
                        className="product-carousel-photo-btn"
                        onClick={() => setZoomed(true)}
                        aria-label={`View photo ${index + 1}`}
                      >
                        <img src={mediaUrl(item.url)} alt={product.name} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {media.length > 1 ? (
                <span className="product-carousel-badge">
                  {active + 1}/{media.length}
                </span>
              ) : null}
            </>
          ) : (
            <div className="product-photo product-photo-empty">Photo coming soon</div>
          )}

          {media.length > 1 ? (
            <div className="product-thumbs">
              {media.map((item, index) => (
                <button
                  key={`${item.type}-${item.url}`}
                  type="button"
                  className={index === active ? "is-active" : ""}
                  onClick={() => scrollToSlide(index)}
                >
                  {item.type === "video" ? (
                    <span className="product-thumb-video" aria-hidden="true">
                      ▶
                    </span>
                  ) : (
                    <img src={mediaUrl(item.url)} alt="" />
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-info">
          <div className="product-mall-head">
            <p className="price product-price product-mall-price">{displayPrice(displayAmount)}</p>
            <h1 className="product-title">{product.name}</h1>
            {seller ? (
              <p className="product-sold-by">
                Sold by{" "}
                <Link className="text-link" to={`/shop/${seller.slug}`}>
                  {product.seller_name}
                </Link>
              </p>
            ) : null}
            <div className="product-mall-tags">
              {categoryMeta ? (
                <Link
                  className="chip"
                  to={`/browse?category=${encodeURIComponent(categoryMeta.id)}`}
                >
                  {categoryMeta.name}
                  {categoryMeta.subcategoryName ? ` · ${categoryMeta.subcategoryName}` : ""}
                </Link>
              ) : null}
              <span className="chip">{product.city}</span>
              <span className="chip product-ref-chip">{code}</span>
            </div>
          </div>

          <div className="product-delivery-strip">
            <div className="product-delivery-strip-copy">
              <span className="product-delivery-city">{product.city}</span>
              <span className="product-delivery-meta">
                {[
                  product.offers_pickup !== false ? "Pickup" : null,
                  product.offers_delivery !== false
                    ? (product.delivery_charge ?? 0) > 0
                      ? "Delivery"
                      : "Delivery available"
                    : null,
                  product.lead_time || null,
                  product.delivery_note || null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <strong className="product-delivery-fee">
              {product.offers_delivery === false
                ? "Pickup"
                : (product.delivery_charge ?? 0) > 0
                  ? displayPrice(product.delivery_charge ?? 0)
                  : "Free"}
            </strong>
          </div>

          <div className="product-mall-rows">
            {variants.length > 0 ? (
              <section className="product-mall-row product-mall-row-options">
                <button
                  type="button"
                  className="product-mall-row-head"
                  onClick={() => toggleRow("options")}
                >
                  <span className="product-mall-row-label">
                    {product.variation_type_label || "Option"}
                  </span>
                  <span className="product-mall-row-value">{selectedVariant?.label || "Choose"}</span>
                  <Chevron open={openRows.options} />
                </button>
                <div className={`product-mall-row-body ${openRows.options ? "is-open" : ""}`}>
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
              </section>
            ) : null}

            <section className="product-mall-row product-mall-row-details">
              <button
                type="button"
                className="product-mall-row-head"
                onClick={() => toggleRow("details")}
              >
                <span className="product-mall-row-label">Details</span>
                <span className="product-mall-row-value product-mall-row-preview">
                  {categoryMeta?.name || product.lead_time || product.seller_name}
                </span>
                <Chevron open={openRows.details} />
              </button>
              <div className={`product-mall-row-body ${openRows.details ? "is-open" : ""}`}>
                  <div className="product-spec-list">
                    {categoryMeta ? (
                      <div className="product-spec-row">
                        <span className="product-spec-label">Category</span>
                        <span className="product-spec-value">
                          <Link
                            className="text-link"
                            to={`/browse?category=${encodeURIComponent(categoryMeta.id)}`}
                          >
                            {categoryMeta.name}
                          </Link>
                          {categoryMeta.subcategoryName
                            ? ` · ${categoryMeta.subcategoryName}`
                            : ""}
                        </span>
                      </div>
                    ) : null}
                    {product.lead_time ? (
                      <div className="product-spec-row">
                        <span className="product-spec-label">Lead time</span>
                        <span className="product-spec-value">{product.lead_time}</span>
                      </div>
                    ) : null}
                    <div className="product-spec-row">
                      <span className="product-spec-label">Delivery</span>
                      <span className="product-spec-value">
                        {(product.delivery_charge ?? 0) > 0
                          ? displayPrice(product.delivery_charge ?? 0)
                          : "Free"}
                        {product.delivery_note ? ` · ${product.delivery_note}` : ""}
                      </span>
                    </div>
                    <div className="product-spec-row">
                      <span className="product-spec-label">Seller</span>
                      <span className="product-spec-value">
                        {seller ? (
                          <Link className="text-link" to={`/shop/${seller.slug}`}>
                            {product.seller_name}
                          </Link>
                        ) : (
                          product.seller_name
                        )}
                      </span>
                    </div>
                    <div className="product-spec-row">
                      <span className="product-spec-label">Reference</span>
                      <span className="product-spec-value">
                        <span className="ref-badge">{code}</span>
                      </span>
                    </div>
                    {payments.length > 0 ? (
                      <div className="product-spec-row">
                        <span className="product-spec-label">Payment</span>
                        <span className="product-spec-value">{payments.join(", ")}</span>
                      </div>
                    ) : null}
                  </div>
                  <p className="muted product-ref-note">
                    Quote the reference when you message the seller.
                  </p>
              </div>
            </section>

            {product.description ? (
              <section className="product-mall-row product-mall-desc">
                <p className="product-mall-row-label">Description</p>
                <p className="product-desc">{product.description}</p>
              </section>
            ) : null}

            <section className="product-report">
              <button
                type="button"
                className="product-report-toggle"
                onClick={() => setReportOpen((open) => !open)}
              >
                Report this listing
              </button>
              {reportOpen ? (
                <form
                  className="product-report-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!product) return;
                    setReportBusy(true);
                    setReportMsg("");
                    api
                      .reportListing({
                        product_id: product.id,
                        reason: reportReason.trim(),
                        reporter_name: reportName.trim(),
                        reporter_email: reportEmail.trim(),
                      })
                      .then(() => {
                        setReportReason("");
                        setReportMsg("Thanks — we received your report.");
                      })
                      .catch((err: Error) => setReportMsg(err.message))
                      .finally(() => setReportBusy(false));
                  }}
                >
                  <label>
                    Why are you reporting this?
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                      minLength={5}
                      rows={3}
                    />
                  </label>
                  <label>
                    Your name (optional)
                    <input value={reportName} onChange={(e) => setReportName(e.target.value)} />
                  </label>
                  <label>
                    Your email (optional)
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                    />
                  </label>
                  {reportMsg ? <p className="muted">{reportMsg}</p> : null}
                  <button className="btn btn-outline" type="submit" disabled={reportBusy}>
                    {reportBusy ? "Sending…" : "Submit report"}
                  </button>
                </form>
              ) : null}
            </section>
          </div>

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
        <div className="product-buy-bar product-mall-bar">
          <Link className="product-bar-icon" to={`/shop/${seller.slug}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span>Store</span>
          </Link>
          {chatHref ? (
            <a className="product-bar-icon" href={chatHref} target="_blank" rel="noreferrer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7 9h10M7 13h6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 2V7a2 2 0 0 1 2-2z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Chat</span>
            </a>
          ) : (
            <span className="product-bar-icon is-disabled" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 2V7a2 2 0 0 1 2-2z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Chat</span>
            </span>
          )}
          <Link className="btn btn-clay product-bar-order" to={orderHref}>
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
