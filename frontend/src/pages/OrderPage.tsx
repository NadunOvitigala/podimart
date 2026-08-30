import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, displayPrice, formatPrice, mediaUrl, productCode } from "../api";
import { LoadingGrid } from "../components/LoadingGrid";
import type { Product, Seller } from "../types";

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
};

const PAYMENT_HINTS: Record<string, string> = {
  cash_on_delivery: "Pay the seller when you receive your order",
  bank_transfer: "Seller will share bank details after you place the order",
};

const DEFAULT_METHODS = ["cash_on_delivery", "bank_transfer"];

export function OrderPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loadError, setLoadError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(searchParams.get("variant") || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [contactOpen, setContactOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [paymentLabel, setPaymentLabel] = useState("");
  const [variantLabel, setVariantLabel] = useState("");

  useEffect(() => {
    api
      .product(id)
      .then((data) => {
        setProduct(data.product);
        setSeller(data.seller);
        const methods = (data.product.payment_methods ?? []).filter((m) => PAYMENT_LABELS[m]);
        setPaymentMethod((methods.length ? methods : DEFAULT_METHODS)[0] || "");
        const variants = data.product.variants ?? [];
        const fromQuery = searchParams.get("variant") || "";
        const match = variants.find((item) => item.id === fromQuery);
        setVariantId(match?.id || variants[0]?.id || "");
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [id, searchParams]);

  const allowedMethods = useMemo(() => {
    if (!product) return DEFAULT_METHODS;
    const methods = (product.payment_methods ?? []).filter((m) => PAYMENT_LABELS[m]);
    return methods.length ? methods : DEFAULT_METHODS;
  }, [product]);

  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((item) => item.id === variantId) || variants[0];
  const unitPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const deliveryCharge = product?.delivery_charge ?? 0;
  const deliveryNote = product?.delivery_note?.trim() || "";

  const priceOnRequest = !unitPrice || unitPrice <= 0;

  const itemsTotalLabel = useMemo(() => {
    if (!product) return "—";
    if (priceOnRequest) return "Contact for price";
    return formatPrice(unitPrice * quantity);
  }, [product, quantity, unitPrice, priceOnRequest]);

  const deliveryLabel = deliveryCharge > 0 ? formatPrice(deliveryCharge) : "Free";

  const grandTotalLabel = useMemo(() => {
    if (!product) return "—";
    if (priceOnRequest) return "Contact for price";
    return formatPrice(unitPrice * quantity + deliveryCharge);
  }, [product, quantity, unitPrice, deliveryCharge, priceOnRequest]);

  const contactSummary = [name.trim(), phone.trim()].filter(Boolean).join(" · ") || "Add your details";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!product) return;
    setError("");
    if (variants.length > 0 && !selectedVariant) {
      setError("Please choose an option.");
      return;
    }
    if (!paymentMethod) {
      setError("Please choose a payment method.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setContactOpen(true);
      setError("Please add your name and WhatsApp / phone.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setContactOpen(true);
      setError("Please add your email so you can receive order updates.");
      return;
    }
    setSending(true);
    try {
      const result = await api.createOrder({
        product_id: product.id,
        quantity,
        payment_method: paymentMethod,
        variant_id: selectedVariant?.id || "",
        buyer_name: name.trim(),
        buyer_phone: phone.trim(),
        buyer_email: email.trim(),
        note: note.trim(),
      });
      setReference(result.order.reference);
      setPaymentLabel(
        result.order.payment_method_label ||
          PAYMENT_LABELS[paymentMethod] ||
          paymentMethod,
      );
      setVariantLabel(result.order.variant_label || selectedVariant?.label || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place this order.");
    } finally {
      setSending(false);
    }
  }

  if (loadError) {
    return (
      <div className="wrap page-top">
        <p className="error">{loadError}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wrap page-top">
        <LoadingGrid count={2} />
      </div>
    );
  }

  if (reference) {
    return (
      <div className="wrap page-top checkout-page">
        <div className="checkout-success panel">
          <h1>Order placed</h1>
          <p>The seller will contact you to confirm this order.</p>
          <p className="order-ref">
            Reference <span className="ref-badge">{reference}</span>
          </p>
          {variantLabel ? <p className="muted">Option: {variantLabel}</p> : null}
          {paymentLabel ? <p className="muted">Payment: {paymentLabel}</p> : null}
          {seller ? (
            <p className="muted">Keep this reference when {seller.name} messages you.</p>
          ) : null}
          <div className="checkout-success-actions">
            <Link className="btn btn-clay" to={`/product/${product.id}`}>
              Back to product
            </Link>
            <Link className="btn btn-outline" to="/browse">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const photo = product.image_url || product.image_urls?.[0] || "";

  return (
    <div className="checkout-page checkout-daraz">
      <div className="checkout-topbar">
        <button
          type="button"
          className="checkout-back"
          aria-label="Back to product"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1>Checkout</h1>
      </div>

      <form id="checkout-form" className="checkout-layout" onSubmit={onSubmit}>
        <div className="checkout-main">
          <section className="checkout-card checkout-delivery">
            <div className="checkout-card-head">
              <h2>Delivery</h2>
              {seller ? (
                <Link className="checkout-head-link" to={`/shop/${seller.slug}`}>
                  Seller shop ›
                </Link>
              ) : null}
            </div>
            <div className="checkout-delivery-card is-selected">
              <div className="checkout-delivery-top">
                <strong>Standard</strong>
                <span>{deliveryLabel}</span>
              </div>
              <p className="checkout-delivery-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7V10z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  {product.city}
                  {product.lead_time ? ` · ${product.lead_time}` : ""}
                  {deliveryNote ? ` · ${deliveryNote}` : ""}
                </span>
              </p>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2>Select payment method</h2>
            </div>
            <div className="checkout-pay-scroll">
              {allowedMethods.map((method) => {
                const selected = paymentMethod === method;
                return (
                  <label
                    key={method}
                    className={selected ? "checkout-pay-card is-selected" : "checkout-pay-card"}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method}
                      checked={selected}
                      onChange={() => setPaymentMethod(method)}
                      required
                    />
                    <strong>{PAYMENT_LABELS[method] || method}</strong>
                    <span>{PAYMENT_HINTS[method] || ""}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="checkout-card checkout-contact-card">
            <button
              type="button"
              className="checkout-contact-toggle"
              onClick={() => setContactOpen((open) => !open)}
              aria-expanded={contactOpen}
            >
              <span className="checkout-contact-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 4h10a2 2 0 0 1 2 2v12l-3-2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="checkout-contact-copy">
                <strong>Contact info</strong>
                <span className="muted">{contactSummary}</span>
              </span>
              <span className={contactOpen ? "checkout-chevron is-open" : "checkout-chevron"}>
                ›
              </span>
            </button>
            {contactOpen ? (
              <div className="checkout-fields">
                <label>
                  Your name
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  WhatsApp / phone
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0771234567"
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </label>
                <p className="muted checkout-email-hint">
                  Required — used for order confirmation and updates from the seller.
                </p>
                <label className="checkout-note">
                  Note to seller
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Pickup, flavour, date needed…"
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2>Order items</h2>
              {seller ? (
                <Link className="checkout-head-link" to={`/shop/${seller.slug}`}>
                  {seller.name}
                </Link>
              ) : null}
            </div>
            <div className="checkout-item">
              {photo ? (
                <img src={mediaUrl(photo)} alt="" className="checkout-item-thumb" />
              ) : (
                <div className="checkout-item-thumb empty">No photo</div>
              )}
              <div className="checkout-item-info">
                <Link to={`/product/${product.id}`} className="checkout-item-name">
                  {product.name}
                </Link>
                <p className="muted">
                  {productCode(product)}
                  {product.city ? ` · ${product.city}` : ""}
                </p>
                {variants.length > 0 ? (
                  <div className="variant-picker checkout-variants">
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
                <div className="checkout-qty">
                  <span>Qty</span>
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
                    }
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="checkout-item-price">
                <strong>{displayPrice(unitPrice)}</strong>
              </div>
            </div>
          </section>
        </div>

        <aside className="checkout-side">
          <section className="checkout-card checkout-summary">
            <div className="checkout-card-head">
              <h2>Order summary</h2>
            </div>
            <dl className="checkout-totals">
              <div>
                <dt>
                  Merchandise subtotal ({quantity} {quantity === 1 ? "item" : "items"})
                </dt>
                <dd>{itemsTotalLabel}</dd>
              </div>
              <div>
                <dt>Shipping fee</dt>
                <dd>
                  {deliveryLabel}
                  {deliveryNote ? (
                    <span className="checkout-delivery-note">{deliveryNote}</span>
                  ) : null}
                </dd>
              </div>
              <div className={priceOnRequest ? "checkout-grand is-quote" : "checkout-grand"}>
                <dt>Total</dt>
                <dd>{grandTotalLabel}</dd>
              </div>
            </dl>
            {priceOnRequest ? (
              <p className="muted checkout-quote-note">
                Shipping is shown above. The seller will confirm the item price with you.
              </p>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            <button className="btn btn-clay checkout-submit" type="submit" disabled={sending || !seller}>
              {sending ? "Placing order…" : "Place order"}
            </button>
            <button
              className="btn btn-outline checkout-cancel"
              type="button"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              Back to product
            </button>
            <p className="muted checkout-fineprint">
              The seller will confirm the order and payment with you directly.
            </p>
          </section>
        </aside>
      </form>

      <div className="checkout-mobile-bar">
        <div className="checkout-mobile-total">
          <span className="checkout-mobile-label">Total</span>
          <strong className={priceOnRequest ? "is-quote" : undefined}>{grandTotalLabel}</strong>
        </div>
        <button
          className="btn btn-clay checkout-mobile-submit"
          type="submit"
          form="checkout-form"
          disabled={sending || !seller}
        >
          {sending ? "Placing…" : "Place order"}
        </button>
      </div>
    </div>
  );
}
