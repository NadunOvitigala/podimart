import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { cognitoEnabled, signInCognito } from "../cognito";

export function LoginPage() {
  const navigate = useNavigate();
  const { token, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const nextToken = cognitoEnabled
        ? await signInCognito(email.trim(), password)
        : (await api.adminLogin(email.trim(), password)).token;
      login(nextToken);
      await api.adminMe();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap auth-shell">
      <div className="auth-card">
        <h1>Admin login</h1>
        <p className="lede">Sign in with your Seller Center account if you have admin access.</p>
        <form className="form" onSubmit={onSubmit}>
          {error ? <div className="error">{error}</div> : null}
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="btn btn-clay" type="submit" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
