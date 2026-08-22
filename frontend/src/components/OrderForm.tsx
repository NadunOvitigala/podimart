import { useMemo, useState, type FormEvent } from "react";
import { api, displayPrice, formatPrice } from "../api";
import type { Product, Seller } from "../types";

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
};

const DEFAULT_METHODS = ["cash_on_delivery", "bank_transfer"];

export function OrderForm({ product, seller }: { product: Product; seller: Seller }) {
  const allowedMethods = useMemo(() => {
    const methods = (product.payment_methods ?? []).filter((id) => PAYMENT_LABELS[id]);
    return methods.length ? methods : DEFAULT_METHODS;
  }, [product.payment_methods]);

  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(allowedMethods[0] || "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  const totalLabel = useMemo(() => {
    if (!product.price || product.price <= 0) return "Contact for price";
    return formatPrice(product.price * quantity);
  }, [product.price, quantity]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
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
        buyer_name: name.trim(),
        buyer_phone: phone.trim(),
        buyer_email: email.trim(),
        note: note.trim(),
      });
      setReference(result.order.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send this order.");
    } finally {
      setSending(false);
    }
  }

  if (reference) {
    return (
      <div className="panel order-form-panel order-success">
        <h3>Order sent</h3>
        <p>The seller will contact you to confirm this order.</p>
        <p className="order-ref">
          Reference <span className="ref-badge">{reference}</span>
        </p>
        <p className="muted">Keep this reference when {seller.name} messages you.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="order-now">
        <button className="btn btn-clay btn-order" type="button" onClick={() => setOpen(true)}>
          Order now
        </button>
        <p className="muted order-hint">
          Send quantity and your contact details. {seller.name} will confirm the order with you.
        </p>
      </div>
    );
  }

  return (
    <form className="panel form order-form-panel" onSubmit={onSubmit}>
      <h3>Order now</h3>
      <p className="muted order-hint">
        {product.name} · {displayPrice(product.price)}
      </p>
      {error ? <p className="error">{error}</p> : null}
      <label>
        Quantity
        <input
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          required
        />
      </label>
      <p className="order-total">Total {totalLabel}</p>
      <fieldset className="payment-fieldset">
        <legend>Payment method</legend>
        <div className="payment-options">
          {allowedMethods.map((method) => (
            <label key={method} className="payment-option">
              <input
                type="radio"
                name="payment_method"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                required
              />
              <span>{PAYMENT_LABELS[method] || method}</span>
            </label>
          ))}
        </div>
      </fieldset>
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
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Note to seller
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Pickup, flavour, date needed…"
        />
      </label>
      <div className="order-form-actions">
        <button className="btn btn-clay" type="submit" disabled={sending}>
          {sending ? "Sending…" : "Submit order"}
        </button>
        <button className="btn btn-outline" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
