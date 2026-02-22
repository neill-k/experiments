import { Suspense } from 'react'
import Link from 'next/link'
import { TagFilter } from '@/components/TagFilter'
import { experiments, allTags, tagCounts } from '@/lib/experiments'

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

export default async function AutoBuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag: activeTag } = await searchParams
  const normalizedActiveTag = activeTag?.toLowerCase()

  const filtered = normalizedActiveTag
    ? experiments.filter((e) => e.tags.includes(normalizedActiveTag))
    : experiments

  return (
    <div className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <h1 className="text-4xl sm:text-5xl tracking-tight text-white">
            Auto-builds
          </h1>
          <p className="mt-4 text-sm font-[family-name:var(--font-body)] text-white/60 leading-relaxed max-w-xl">
            All experiments shipped by the nightly build pipeline.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-[13px] font-[family-name:var(--font-mono)] text-white/30">
              {experiments.length} experiments.
            </p>
            <Link
              href="/"
              className="text-[11px] font-[family-name:var(--font-mono)] text-white/40 hover:text-white/70 transition-colors"
            >
              Back to main page
            </Link>
          </div>
          <div className="mt-4 h-px w-16 bg-white/20" />
        </header>

        <Suspense>
          <TagFilter allTags={allTags} tagCounts={tagCounts} totalCount={experiments.length} />
        </Suspense>

        {normalizedActiveTag && (
          <div className="mt-4 flex items-center gap-3" role="status" aria-live="polite">
            <p className="text-[11px] font-[family-name:var(--font-mono)] text-white/25">
              Showing {filtered.length} of {experiments.length} experiments for “{normalizedActiveTag}”.
            </p>
            <Link
              href="/e/auto-builds"
              aria-label={`Clear ${normalizedActiveTag} filter and show all experiments`}
              className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-white/35 hover:text-white/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Clear filter
            </Link>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {filtered.map((exp, i) => (
            <Link
              key={exp.slug}
              href={`/e/${exp.slug}`}
              aria-label={`Open ${exp.title}, published ${exp.date}`}
              className="experiment-card group block border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5 text-white/80 hover:text-white animate-fade-in-up focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
                    {!isToday(exp.date) && !isRecent(exp.date) && exp.lastUpdated && isRecent(exp.lastUpdated) && (
                      <span className="bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-[family-name:var(--font-mono)] font-medium text-emerald-400/70 uppercase tracking-wider">
                        updated
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm font-[family-name:var(--font-body)] text-white/45">
                    {exp.description}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <time
                    dateTime={exp.date}
                    title={`Published ${exp.date}`}
                    aria-label={`Published date ${exp.date}`}
                    className="block font-[family-name:var(--font-mono)] text-[11px] text-white/30"
                  >
                    {exp.date}
                  </time>
                  <time
                    dateTime={exp.date}
                    title={`Published ${exp.date}`}
                    aria-label={`Published ${exp.date} (${relativeDate(exp.date)})`}
                    className="block font-[family-name:var(--font-mono)] text-[10px] text-white/20 mt-0.5"
                  >
                    {relativeDate(exp.date)}
                  </time>
                  {exp.lastUpdated && exp.lastUpdated !== exp.date && (
                    <time
                      dateTime={exp.lastUpdated}
                      title={`Updated ${exp.lastUpdated}`}
                      aria-label={`Updated ${exp.lastUpdated} (${relativeDate(exp.lastUpdated)})`}
                      className="block font-[family-name:var(--font-mono)] text-[10px] text-emerald-400/40 mt-1"
                    >
                      <span aria-hidden="true">↻ </span>
                      {relativeDate(exp.lastUpdated)}
                    </time>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {exp.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest transition-colors ${
                      normalizedActiveTag === tag ? 'text-white/60' : 'text-white/25'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {exp.tech && exp.tech.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {exp.tech.map((t) => (
                    <span
                      key={t}
                      className="border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] text-white/20 group-hover:text-white/30 group-hover:border-white/[0.1] transition-colors"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-[family-name:var(--font-body)] text-white/30">
                {normalizedActiveTag
                  ? <>No experiments match “{normalizedActiveTag}” yet.</>
                  : 'No experiments match that tag yet.'}
              </p>
              {normalizedActiveTag && (
                <Link
                  href="/e/auto-builds"
                  aria-label={`Clear ${normalizedActiveTag} filter and show all experiments`}
                  className="mt-2 inline-block text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-white/35 hover:text-white/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Show all experiments
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
