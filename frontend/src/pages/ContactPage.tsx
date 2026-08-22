import { useState, type FormEvent } from "react";

const CONTACT_EMAIL = "hello@podimart.lk";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const body = encodeURIComponent(`From: ${name}\n${email}\n\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("podimart.lk enquiry")}&body=${body}`;
  }

  return (
    <div className="wrap page-top page-narrow">
      <h1>Contact us</h1>
      <p className="lede">
        Questions about the marketplace, a listing, or opening a shop? We are happy to help.
      </p>

      <div className="panel form">
        <p className="muted">
          Email{" "}
          <a className="text-link" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          or use the form below.
        </p>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              required
            />
          </label>
          <button className="btn btn-clay" type="submit">
            Send email
          </button>
        </form>
      </div>
    </div>
  );
}
