import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "Colombo",
    whatsapp: "",
    phone: "",
  });

  useEffect(() => {
    api.cities().then(setCities).catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api.signup(form);
      login(data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create shop.");
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 520, paddingTop: 40 }}>
      <h1>Open a free shop</h1>
      <p className="lede">
        No website needed. Buyers will find you on podimart.lk by category and
        city, then message you on WhatsApp.
      </p>
      <form className="form" onSubmit={onSubmit}>
        {error ? <div className="error">{error}</div> : null}
        <label>
          Shop name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Maya's Home Cakes"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </label>
        <label>
          City
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          >
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </label>
        <label>
          WhatsApp number
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="0771234567"
          />
        </label>
        <label>
          Call number
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <button className="btn btn-clay" type="submit">
          Create my shop
        </button>
      </form>
      <p>
        Already listed? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
