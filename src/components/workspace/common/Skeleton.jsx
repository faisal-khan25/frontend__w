export function SkeletonList({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-line shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded bg-line w-2/3" />
            <div className="h-2.5 rounded bg-line w-1/2" />
          </div>
          <div className="h-2.5 rounded bg-line w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 rounded bg-line w-1/3" />
      <div className="h-3 rounded bg-line w-full" />
      <div className="h-3 rounded bg-line w-4/5" />
    </div>
  );
}
