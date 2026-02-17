export default function ExperimentLoading() {
  return (
    <div className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        {/* Title skeleton */}
        <div className="h-9 w-64 bg-white/[0.05] animate-pulse" />
        <div className="mt-3 h-4 w-full max-w-lg bg-white/[0.03] animate-pulse" />
        <div className="mt-1.5 h-4 w-3/4 max-w-md bg-white/[0.03] animate-pulse" />

        {/* Content area skeleton */}
        <div className="mt-8 space-y-4">
          <div className="h-64 w-full bg-white/[0.02] border border-[var(--border)] animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/[0.03] animate-pulse" />
            <div className="h-4 w-5/6 bg-white/[0.03] animate-pulse" />
            <div className="h-4 w-2/3 bg-white/[0.03] animate-pulse" />
          </div>
        </div>

        {/* Bottom nav skeleton */}
        <div className="mt-12 border-t border-[var(--border)] pt-6 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-16 bg-white/[0.02] animate-pulse" />
            <div className="h-4 w-28 bg-white/[0.03] animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-2.5 w-24 bg-white/[0.02] animate-pulse" />
            <div className="h-2.5 w-16 bg-white/[0.02] animate-pulse" />
          </div>
          <div className="space-y-1 flex flex-col items-end">
            <div className="h-2.5 w-12 bg-white/[0.02] animate-pulse" />
            <div className="h-4 w-28 bg-white/[0.03] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
