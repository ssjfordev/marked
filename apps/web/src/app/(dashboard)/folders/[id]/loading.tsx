export default function FolderLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded mb-2" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border overflow-hidden">
            <div className="h-36 bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
