import Link from 'next/link'
import { experiments } from '@/lib/experiments'
import { homepageJsonLd } from '@/lib/json-ld'

export default function Home() {
  const favorites = experiments.filter((e) => e.favorite)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd()) }}
      />
      <div className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <h1 className="text-4xl sm:text-5xl tracking-tight text-white">
            Experiments
          </h1>
          <p className="mt-4 text-sm font-[family-name:var(--font-body)] text-white/60 leading-relaxed max-w-xl">
            A curated home for experiments and prototypes. The full auto-build run is now archived.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-[13px] font-[family-name:var(--font-mono)] text-white/30">
              {experiments.length} total experiments.
            </p>
          </div>
          <div className="mt-4 h-px w-16 bg-white/20" />
        </header>

        {/* Neill's Favorites */}
        {favorites.length > 0 && (
          <section className="mt-10 mb-8">
            <h2 className="text-xs font-[family-name:var(--font-mono)] text-white/30 uppercase tracking-widest mb-4">
              Neill&apos;s Favorites
            </h2>
            <div className={`grid gap-3 ${favorites.length === 1 ? 'grid-cols-1 max-w-sm' : favorites.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
              {favorites.map((exp, i) => (
                <Link
                  key={exp.slug}
                  href={`/e/${exp.slug}`}
                  aria-label={`Open ${exp.title}, published ${exp.date}`}
                  className="group block border border-[var(--border)] bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors animate-fade-in-up focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    borderTopColor: exp.accent ?? 'var(--border)',
                    borderTopWidth: '3px',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {exp.icon && (
                      <span className="text-lg leading-none" aria-hidden="true">
                        {exp.icon}
                      </span>
                    )}
                    <span className="text-sm font-[family-name:var(--font-display)] text-white/90 group-hover:text-white transition-colors">
                      {exp.title}
                    </span>
                  </div>
                  <p className="text-xs font-[family-name:var(--font-body)] text-white/40 leading-relaxed line-clamp-2">
                    {exp.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5">
          <p className="text-sm font-[family-name:var(--font-body)] text-white/50">
            Looking for the full nightly run history?
          </p>
          <Link
            href="/e/auto-builds"
            className="mt-2 inline-block font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-white/50 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Open auto-build archive →
          </Link>
        </section>

        <footer className="mt-16 border-t border-[var(--border)] pt-6 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <p className="font-[family-name:var(--font-mono)] text-[11px] text-white/25">
                Curated collection of experiments
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/feed.xml"
                aria-label="Subscribe via RSS feed"
                className="font-[family-name:var(--font-mono)] text-[11px] text-white/25 hover:text-white/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                title="RSS Feed"
              >
                RSS
              </a>
              <span className="text-white/10" aria-hidden="true">·</span>
              <a
                href="https://github.com/neill-k/experiments"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub (opens in new tab)"
                className="font-[family-name:var(--font-mono)] text-[11px] text-white/25 hover:text-white/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                View source
              </a>
              <span className="text-white/10" aria-hidden="true">·</span>
              <a
                href="https://openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Powered by OpenClaw (opens in new tab)"
                className="font-[family-name:var(--font-mono)] text-[11px] text-white/25 hover:text-white/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Powered by OpenClaw
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  )
}
