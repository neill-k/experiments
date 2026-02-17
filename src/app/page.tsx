import { Suspense } from 'react'
import Link from 'next/link'
import { TagFilter } from '@/components/TagFilter'
import { experiments, allTags, tagCounts } from '@/lib/experiments'
import { homepageJsonLd } from '@/lib/json-ld'

const isToday = (dateStr: string) => {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

const isRecent = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 2
}

const relativeDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00Z')
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const yesterdayDate = new Date(now)
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  if (dateStr === todayStr) return 'today'
  if (dateStr === yesterdayStr) return 'yesterday'

  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 60) return '1 month ago'
  return `${Math.floor(diffDays / 30)} months ago`
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag: activeTag } = await searchParams

  const filtered = activeTag
    ? experiments.filter((e) => e.tags.includes(activeTag))
    : experiments

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
            Every night, an autonomous pipeline dreams up, plans, builds, and
            tests a new experiment. No human in the loop until morning. The
            idea is simple: give an AI agent a cron schedule and a blank canvas,
            then see what it ships by sunrise.
          </p>
          <details className="mt-3 max-w-xl group">
            <summary className="text-[11px] font-[family-name:var(--font-mono)] text-white/30 hover:text-white/50 cursor-pointer select-none transition-colors list-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="transition-transform duration-150 group-open:rotate-90" aria-hidden="true">
                  <path d="M3.5 2L7 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                How it works
              </span>
            </summary>
            <div className="mt-2 space-y-3">
              <p className="text-sm font-[family-name:var(--font-body)] text-white/40 leading-relaxed">
                Four stages run on a timer: an ideator proposes concepts at 9 PM,
                a planner architects the build at 10, an implementer writes the code
                at 11:30, and a tester validates it by 2:30 AM. Each stage can
                incorporate feedback if I catch it in time. Otherwise it just ships.
              </p>
              <p className="text-sm font-[family-name:var(--font-body)] text-white/40 leading-relaxed">
                Each experiment has a comment section. Leave feedback and it might
                get picked up in the next iteration. Or point your own AI agent at
                it and let it weigh in.
              </p>
            </div>
          </details>
          <p className="mt-3 text-[13px] font-[family-name:var(--font-mono)] text-white/30">
            {experiments.length} prototypes shipped. Click to explore.
          </p>
          <div className="mt-4 h-px w-16 bg-white/20" />
        </header>

        {/* Tag filter bar - client component for interactivity */}
        <Suspense>
          <TagFilter allTags={allTags} tagCounts={tagCounts} totalCount={experiments.length} />
        </Suspense>

        <div className="mt-6 space-y-3">
          {filtered.map((exp, i) => (
            <Link
              key={exp.slug}
              href={`/e/${exp.slug}`}
              className="experiment-card block border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5 text-white/80 hover:text-white animate-fade-in-up"
              style={{
                animationDelay: `${i * 80}ms`,
                borderLeftColor: exp.accent ?? 'var(--border)',
                borderLeftWidth: exp.accent ? '3px' : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {exp.icon && (
                      <span className="text-lg leading-none" aria-hidden="true">
                        {exp.icon}
                      </span>
                    )}
                    <span className="text-base font-[family-name:var(--font-display)] text-white/90">
                      {exp.title}
                    </span>
                    {isToday(exp.date) && (
                      <span className="bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-[family-name:var(--font-mono)] font-medium text-emerald-400 uppercase tracking-wider">
                        new
                      </span>
                    )}
                    {!isToday(exp.date) && isRecent(exp.date) && (
                      <span className="bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-[family-name:var(--font-mono)] font-medium text-blue-400 uppercase tracking-wider">
                        recent
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm font-[family-name:var(--font-body)] text-white/45">
                    {exp.description}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-[family-name:var(--font-mono)] text-[11px] text-white/30">
                    {exp.date}
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-[10px] text-white/20 mt-0.5">
                    {relativeDate(exp.date)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {exp.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest transition-colors ${
                      activeTag === tag ? 'text-white/60' : 'text-white/25'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm font-[family-name:var(--font-body)] text-white/30">
              No experiments match that tag yet.
            </p>
          )}
        </div>

        <footer className="mt-16 border-t border-[var(--border)] pt-6 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <p className="font-[family-name:var(--font-mono)] text-[11px] text-white/25">
                Built overnight by an autonomous pipeline
              </p>
              {experiments.length > 0 && (
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-white/20">
                  Last shipped {experiments[0].date}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/feed.xml"
                className="font-[family-name:var(--font-mono)] text-[11px] text-white/25 hover:text-white/50 transition-colors"
                title="RSS Feed"
              >
                RSS
              </a>
              <span className="text-white/10">·</span>
              <a
                href="https://github.com/neill-k/experiments"
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-mono)] text-[11px] text-white/25 hover:text-white/50 transition-colors"
              >
                View source
              </a>
              <span className="text-white/10">·</span>
              <a
                href="https://openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-mono)] text-[11px] text-white/25 hover:text-white/50 transition-colors"
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
