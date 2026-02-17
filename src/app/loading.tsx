export default function HomeLoading() {
  return (
    <div className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header skeleton */}
        <header>
          <div className="h-10 w-56 bg-white/[0.04] animate-pulse" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full max-w-xl bg-white/[0.03] animate-pulse" />
            <div className="h-4 w-3/4 max-w-md bg-white/[0.03] animate-pulse" />
          </div>
          <div className="mt-3 h-3 w-48 bg-white/[0.03] animate-pulse" />
          <div className="mt-4 h-px w-16 bg-white/10" />
        </header>

        {/* Tag filter bar skeleton */}
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-6 bg-white/[0.03] animate-pulse"
              style={{ width: `${48 + i * 12}px` }}
            />
          ))}
        </div>

        {/* Card skeletons */}
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5 animate-pulse"
              style={{
                animationDelay: `${i * 100}ms`,
                borderLeftWidth: '3px',
                borderLeftColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-5 w-5 bg-white/[0.04]" />
                    <div className="h-5 w-36 bg-white/[0.05]" />
                  </div>
                  <div className="mt-2 h-4 w-4/5 bg-white/[0.03]" />
                </div>
                <div className="shrink-0">
                  <div className="h-3 w-20 bg-white/[0.03]" />
                  <div className="mt-1 h-2.5 w-14 bg-white/[0.02]" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="h-2.5 w-12 bg-white/[0.02]" />
                <div className="h-2.5 w-16 bg-white/[0.02]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
