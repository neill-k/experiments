'use client'

import Link from 'next/link'

const experiments = [
  {
    slug: 'prompt-library',
    date: '2026-02-14',
    title: 'Prompt Library',
    description: 'Organize, version, and test prompts for LLM applications'
  },
  {
    slug: 'agent-spec-builder',
    date: '2026-02-13',
    title: 'Agent Spec Builder',
    description: 'Turn agent ideas into implementable Markdown specs'
  }
]

const isToday = (dateStr: string) => {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

export default function Home() {
  return (
    <main className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Experiments</h1>
          <p className="mt-3 text-sm text-white/60">
            Daily shipped prototypes. Click one to view.
          </p>
        </header>
        
        <div className="mt-8 space-y-2">
          {experiments.map((exp) => (
            <Link
              key={exp.slug}
              href={`/e/${exp.slug}`}
              className="block border border-[#2a2a2a] bg-white/[0.02] p-3 sm:p-4 text-white/80 hover:border-white/20"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{exp.title}</span>
                {isToday(exp.date) && (
                  <span className="rounded-none bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    NEW
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-white/50">{exp.description}</div>
              <div className="mt-1 text-xs text-white/40">{exp.date}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
