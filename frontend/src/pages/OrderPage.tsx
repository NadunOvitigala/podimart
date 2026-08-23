import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, displayPrice, formatPrice, mediaUrl, productCode } from "../api";
import { Breadcrumb } from "../components/Breadcrumb";
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

  const itemsTotalLabel = useMemo(() => {
    if (!product) return "—";
    if (!unitPrice || unitPrice <= 0) return "Contact for price";
    return formatPrice(unitPrice * quantity);
  }, [product, quantity, unitPrice]);

  const deliveryLabel = deliveryCharge > 0 ? formatPrice(deliveryCharge) : "Free";

  const grandTotalLabel = useMemo(() => {
    if (!product) return "—";
    if (!unitPrice || unitPrice <= 0) {
      if (deliveryCharge > 0) return `${formatPrice(deliveryCharge)} delivery · contact for item price`;
      return "Contact for price";
    }
    return formatPrice(unitPrice * quantity + deliveryCharge);
  }, [product, quantity, unitPrice, deliveryCharge]);

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
    <div className="wrap page-top checkout-page">
      <Breadcrumb
        items={[
          { label: "Marketplace", to: "/browse" },
          { label: product.name, to: `/product/${product.id}` },
          { label: "Place order" },
        ]}
      />
      <h1 className="checkout-title">Place order</h1>
      <form id="checkout-form" className="checkout-layout" onSubmit={onSubmit}>
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2>Order items</h2>
              {seller ? (
                <Link className="text-link" to={`/shop/${seller.slug}`}>
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

          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2>Contact details</h2>
            </div>
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
                  placeholder="Optional"
                />
              </label>
              <label className="checkout-note">
                Note to seller
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Pickup, flavour, date needed…"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="checkout-side">
          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2>Select payment method</h2>
            </div>
            <div className="checkout-payments">
              {allowedMethods.map((method) => {
                const selected = paymentMethod === method;
                return (
                  <label
                    key={method}
                    className={selected ? "checkout-pay-option is-selected" : "checkout-pay-option"}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method}
                      checked={selected}
                      onChange={() => setPaymentMethod(method)}
                      required
                    />
                    <span className="checkout-pay-copy">
                      <strong>{PAYMENT_LABELS[method] || method}</strong>
                      <span className="muted">{PAYMENT_HINTS[method] || ""}</span>
                    </span>
                    <span className="checkout-pay-check" aria-hidden="true">
                      {selected ? "✓" : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="checkout-card checkout-summary">
            <div className="checkout-card-head">
              <h2>Order summary</h2>
            </div>
            <dl className="checkout-totals">
              <div>
                <dt>
                  Items ({quantity} {quantity === 1 ? "item" : "items"})
                </dt>
                <dd>{itemsTotalLabel}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {deliveryLabel}
                  {deliveryNote ? (
                    <span className="checkout-delivery-note">{deliveryNote}</span>
                  ) : null}
                </dd>
              </div>
              <div className="checkout-grand">
                <dt>Total</dt>
                <dd>{grandTotalLabel}</dd>
              </div>
            </dl>
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
          <strong>{grandTotalLabel}</strong>
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
