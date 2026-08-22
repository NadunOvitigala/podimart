import { Link } from "react-router-dom";

export function EmptyState({
  title,
  text,
  actionLabel,
  actionTo,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16M4 12h10M4 17h7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {actionLabel && actionTo ? (
        <Link className="btn btn-clay" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
