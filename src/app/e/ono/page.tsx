'use client'

import { useEffect, useState } from 'react'
import { ONO, CATEGORY_LABELS, type Category } from '@/lib/ono/constants'
import { ProblemCard } from './components/ProblemCard'
import { ExperimentNav } from '@/components/ExperimentNav'
import { Comments } from '@/components/comments/Comments'

interface Problem {
  id: string
  slug: string
  title: string
  description: string
  constraints: string
  category: Category
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'legendary'
  function_name: string
  function_sig: string
  optimal_loc: number
  created_at: string
}

export default function OnoPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')

  useEffect(() => {
    fetch('/api/ono/problems')
      .then((res) => res.json())
      .then((data) => {
        setProblems(data.problems ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered =
    selectedCategory === 'all'
      ? problems
      : problems.filter((p) => p.category === selectedCategory)

  const categories: (Category | 'all')[] = ['all', 'classic', 'scale', 'ml', 'systems']

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <div className="px-4 py-10 sm:px-6 sm:py-14">
        <h1
          className="font-[family-name:var(--font-mono)] text-3xl sm:text-4xl tracking-tight"
          style={{ color: ONO.textPrimary }}
        >
          Competitive programming for the rest of us.
        </h1>
        <p
          className="mt-4 max-w-2xl font-[family-name:var(--font-body)] text-sm leading-relaxed"
          style={{ color: ONO.textSecondary }}
        >
          Every submitted solution must pass all test cases. Scoring rewards inefficiency,
          over-engineering, and computational horror. Your solution must be correct. Make us
          regret that it works.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="font-[family-name:var(--font-mono)] text-[11px] px-2 py-1 border"
            style={{ color: ONO.amber, borderColor: ONO.amber }}
          >
            {problems.length} PROBLEMS
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[11px]"
            style={{ color: ONO.textMuted }}
          >
            Python only. For now.
          </span>
        </div>
      </div>

      {/* Category filter */}
      <div
        className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2 border-b"
        style={{ borderColor: ONO.border }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest px-2.5 py-1 border transition-colors"
            style={{
              borderColor: selectedCategory === cat ? ONO.amber : ONO.border,
              color: selectedCategory === cat ? ONO.amber : ONO.textMuted,
              backgroundColor: selectedCategory === cat ? ONO.amberGlow : 'transparent',
            }}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Problem list */}
      <div className="px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse border"
                style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p
              className="font-[family-name:var(--font-mono)] text-sm"
              style={{ color: ONO.textMuted }}
            >
              {problems.length === 0
                ? 'No problems available yet. Check back soon.'
                : 'No problems in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((problem, i) => (
              <ProblemCard
                key={problem.slug}
                slug={problem.slug}
                title={problem.title}
                description={problem.description}
                difficulty={problem.difficulty}
                category={problem.category}
                optimalLoc={problem.optimal_loc}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div
        className="mx-4 sm:mx-6 mb-8 border"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <div className="px-4 py-2 border-b" style={{ borderColor: ONO.border }}>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
            style={{ color: ONO.textMuted }}
          >
            How It Works
          </span>
        </div>
        <div className="px-4 py-4 space-y-4">
          {[
            {
              step: '01',
              title: 'Pick a problem',
              desc: 'Choose from classic algorithms. The optimal solution is provided for context.',
            },
            {
              step: '02',
              title: 'Write something terrible',
              desc: 'Create a solution.py in a public GitHub repo. It must pass all test cases.',
            },
            {
              step: '03',
              title: 'Submit your repo URL',
              desc: 'We fetch your code, run it in a sandbox, and score its inefficiency.',
            },
            {
              step: '04',
              title: 'Climb the leaderboard',
              desc: 'The most gloriously terrible solutions rise to the top of the Hall of Shame.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span
                className="font-[family-name:var(--font-mono)] text-lg shrink-0"
                style={{ color: ONO.amber }}
              >
                {item.step}
              </span>
              <div>
                <p
                  className="font-[family-name:var(--font-mono)] text-xs"
                  style={{ color: ONO.textPrimary }}
                >
                  {item.title}
                </p>
                <p
                  className="font-[family-name:var(--font-body)] text-xs mt-0.5"
                  style={{ color: ONO.textMuted }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="px-4 py-8" style={{ borderTop: `1px solid ${ONO.border}` }}>
        <Comments slug="ono" />
      </div>

      <ExperimentNav />
    </div>
  )
}
