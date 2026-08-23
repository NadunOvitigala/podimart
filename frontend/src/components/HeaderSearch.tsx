import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function HeaderSearch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const [draft, setDraft] = useState(q);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    navigate(next ? `/browse?q=${encodeURIComponent(next)}` : "/browse");
  }

  return (
    <form className="header-search" onSubmit={onSearch} role="search">
      <span className="header-search-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search cakes, crafts, gifts…"
        className="header-search-input"
        aria-label="Search marketplace"
      />
      <button className="btn btn-clay header-search-btn" type="submit">
        <span className="search-btn-full">Search</span>
        <span className="search-btn-short" aria-hidden="true">
          Search
        </span>
      </button>
    </form>
  );
}
