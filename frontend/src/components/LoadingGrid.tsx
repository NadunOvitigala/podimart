export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-mall loading-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="card skeleton-card" key={index}>
          <div className="skeleton skeleton-cover" />
          <div className="card-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}
