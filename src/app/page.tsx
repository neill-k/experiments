'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'

type Experiment = {
  slug: string
  created_at: string
}

export default function Home() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadExperiments() {
      const { data } = await getSupabase()
        .from('experiments')
        .select('slug, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      setExperiments(data ?? [])
      setLoading(false)
    }
    loadExperiments()
  }, [])

  const examples = experiments.length > 0 
    ? experiments 
    : [
        { slug: '2026-02-13-agent-spec-builder', created_at: new Date().toISOString() },
        { slug: 'demo-synthwave-typography', created_at: new Date().toISOString() }
      ]
  
  return (
    <main className="min-h-dvh px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Experiments</h1>
        <p className="mt-3 text-sm text-white/60">
          Daily shipped prototypes. Click one to view and leave comments.
        </p>
        
        {loading ? (
          <div className="mt-8 text-sm text-white/50">Loading experiments...</div>
        ) : (
          <div className="mt-8 space-y-2">
            {examples.map((exp) => (
              <Link
                key={exp.slug}
                href={`/e/${exp.slug}`}
                className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/80 hover:border-white/20"
              >
                <div className="text-sm font-medium">{exp.slug}</div>
                <div className="mt-1 text-xs text-white/50">{new Date(exp.created_at).toLocaleDateString()} · Open →</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
