export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Placeholder for a list of rows shaped like "label … trailing value". */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3.5 w-16" />
        </li>
      ))}
    </ul>
  );
}

/** Placeholder for a chart canvas. */
export function SkeletonChart({ className = 'h-48 w-full' }: { className?: string }) {
  return <Skeleton className={className} />;
}

/** Placeholder for a row of stat tiles (label + big value), matching card-surface tiles. */
export function SkeletonStatGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card-surface p-4">
          <Skeleton className="h-2.5 w-2/3" />
          <Skeleton className="mt-2 h-7 w-1/2" />
        </div>
      ))}
    </div>
  );
}
