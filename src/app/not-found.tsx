import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16 flex items-center justify-center">
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-white/20">
          experiment not found
        </div>
        <h1 className="mt-4 text-7xl sm:text-8xl tracking-tight text-white/10 font-[family-name:var(--font-display)]">
          404
        </h1>
        <p className="mt-4 text-sm font-[family-name:var(--font-body)] text-white/40 leading-relaxed">
          This experiment doesn&apos;t exist yet - or it dissolved
          <br className="hidden sm:inline" />
          {' '}into the void like a dreamer blob.
        </p>
        <div className="mt-8 h-px w-16 bg-white/10 mx-auto" />
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 border border-[var(--border)] bg-white/[0.02] px-5 py-2.5 text-sm font-[family-name:var(--font-body)] text-white/60 hover:text-white hover:border-[var(--border-hover)] transition-all duration-200"
        >
          <span className="text-white/30">←</span>
          Back to experiments
        </Link>
      </div>
    </div>
  )
}
