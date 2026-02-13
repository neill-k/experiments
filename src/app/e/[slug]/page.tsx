import Link from 'next/link'
import { AuthButtons } from '@/components/AuthButtons'
import { Comments } from '@/components/comments/Comments'

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xs text-white/60 hover:text-white/80">
            ← Experiments
          </Link>
          <AuthButtons />
        </div>

        <header className="mt-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">{slug}</h1>
          <p className="mt-2 text-sm text-white/60">
            Experiment page shell (placeholder). Interactive surface goes here.
          </p>
        </header>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="text-sm text-white/70">Experiment surface placeholder.</div>
          <div className="mt-2 text-xs text-white/40">
            (Later: dynamic registry import, full-screen mode, tags, etc.)
          </div>
        </div>

        <Comments slug={slug} />
      </div>
    </main>
  )
}
