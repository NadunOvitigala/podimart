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
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search listings or shops"
        className="header-search-input"
        aria-label="Search marketplace"
      />
      <button className="btn btn-clay" type="submit">
        <span className="search-btn-full">Search</span>
        <span className="search-btn-short" aria-hidden="true">
          Go
        </span>
      </button>
    </form>
  );
}
