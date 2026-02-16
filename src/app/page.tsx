import { Suspense } from 'react'
import Link from 'next/link'
import { TagFilter } from '@/components/TagFilter'

const experiments = [
  {
    slug: 'the-blob',
    date: '2026-02-15',
    title: 'The Blob',
    description: 'A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch',
    tags: ['creative', 'canvas', 'interactive'],
  },
  {
    slug: 'prompt-library',
    date: '2026-02-14',
    title: 'Prompt Library',
    description: 'Organize, version, and test prompts for LLM applications',
    tags: ['tools', 'llm'],
  },
  {
    slug: 'agent-spec-builder',
    date: '2026-02-13',
    title: 'Agent Spec Builder',
    description: 'Turn agent ideas into implementable Markdown specs',
    tags: ['agents', 'specs'],
  },
]

const allTags = Array.from(new Set(experiments.flatMap((e) => e.tags))).sort()

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
    <main className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
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
          <p className="mt-3 text-sm font-[family-name:var(--font-body)] text-white/40 leading-relaxed max-w-xl">
            Four stages run on a timer: an ideator proposes concepts at 9 PM,
            a planner architects the build at 10, an implementer writes the code
            at 11:30, and a tester validates it by 2:30 AM. Each stage can
            incorporate feedback if I catch it in time. Otherwise it just ships.
          </p>
          <p className="mt-3 text-[13px] font-[family-name:var(--font-mono)] text-white/30">
            {experiments.length} prototypes shipped — click to explore.
          </p>
          <div className="mt-4 h-px w-16 bg-white/20" />
        </header>

        {/* Tag filter bar — client component for interactivity */}
        <Suspense>
          <TagFilter allTags={allTags} />
        </Suspense>

        <div className="mt-6 space-y-3">
          {filtered.map((exp, i) => (
            <Link
              key={exp.slug}
              href={`/e/${exp.slug}`}
              className="experiment-card block border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5 text-white/80 hover:text-white animate-fade-in-up"
              style={{
                animationDelay: `${i * 80}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
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

        <footer className="mt-16 border-t border-[var(--border)] pt-6">
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-white/25">
            Built overnight
          </p>
        </footer>
      </div>
    </main>
  )
}
