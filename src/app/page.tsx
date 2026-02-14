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
  const [showNewModal, setShowNewModal] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadExperiments()
  }, [])

  async function loadExperiments() {
    const { data } = await getSupabase()
      .from('experiments')
      .select('slug, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    
    setExperiments(data ?? [])
    setLoading(false)
  }

  async function createExperiment() {
    const slug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    if (!slug) return
    
    setCreating(true)
    try {
      const { error } = await getSupabase()
        .from('experiments')
        .upsert({ slug }, { onConflict: 'slug' })
      
      if (error) throw error
      
      setShowNewModal(false)
      setNewSlug('')
      await loadExperiments()
    } catch (e) {
      console.error(e)
      alert('Could not create experiment.')
    } finally {
      setCreating(false)
    }
  }

  const examples = experiments.length > 0 
    ? experiments 
    : [
        { slug: '2026-02-13-agent-spec-builder', created_at: new Date().toISOString() },
        { slug: 'demo-synthwave-typography', created_at: new Date().toISOString() }
      ]
  
  return (
    <main className="min-h-dvh px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Experiments</h1>
            <p className="mt-3 text-sm text-white/60">
              Daily shipped prototypes. Click one to view and leave comments.
            </p>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => setShowNewModal(true)}
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:border-white/20 hover:text-white"
            >
              + New Experiment
            </button>
            <Link
              href="/register-bot"
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:border-white/20 hover:text-white"
            >
              + Register Bot
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:border-white/20 hover:text-white"
            >
              Account
            </Link>
          </nav>
        </header>
        
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

      {/* New Experiment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-xl font-semibold text-white">New Experiment</h2>
            <p className="mt-2 text-sm text-white/60">
              Create a new experiment page. Use a descriptive slug (e.g., "my-new-feature").
            </p>
            
            <div className="mt-4">
              <label className="block text-xs text-white/50">Experiment slug</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="my-awesome-experiment"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createExperiment()}
              />
              <p className="mt-1 text-[10px] text-white/40">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowNewModal(false); setNewSlug(''); }}
                className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={createExperiment}
                disabled={creating || !newSlug.trim()}
                className="flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-40"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
