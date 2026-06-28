export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 rounded skeleton" />

      {/* Hero skeleton */}
      <div className="glass rounded-2xl p-5 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-5 w-28 rounded skeleton" />
              <div className="h-5 w-32 rounded skeleton" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl skeleton" />
              <div className="space-y-2">
                <div className="h-9 w-40 rounded skeleton" />
                <div className="h-4 w-56 rounded skeleton" />
              </div>
            </div>
            <div className="h-12 w-64 rounded skeleton" />
            <div className="flex gap-3">
              <div className="h-16 w-40 rounded-xl skeleton" />
              <div className="h-16 w-40 rounded-xl skeleton" />
            </div>
          </div>
          <div className="h-60 rounded-xl skeleton" />
        </div>
      </div>

      {/* Status bar skeleton */}
      <div className="h-12 rounded-xl skeleton" />

      {/* KPI grid skeleton */}
      <div>
        <div className="mb-3 h-6 w-48 rounded skeleton" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl skeleton" />
          ))}
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="h-[440px] rounded-xl skeleton" />

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 rounded-xl skeleton" />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted">
        <span className="h-2 w-2 animate-ping rounded-full bg-gold" />
        Đang tải dữ liệu thật từ VNStock (Free Tier)...
      </div>
    </div>
  );
}
