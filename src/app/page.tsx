import Link from 'next/link'

export default function Home() {
  const examples = ['2026-02-13-agent-spec-builder', 'demo-synthwave-typography']
  return (
    <main className="min-h-dvh px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Experiments</h1>
        <p className="mt-3 text-sm text-white/60">
          Daily shipped prototypes. Click one to view and leave comments.
        </p>
        <div className="mt-8 space-y-2">
          {examples.map((slug) => (
            <Link
              key={slug}
              href={`/e/${slug}`}
              className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/80 hover:border-white/20"
            >
              <div className="text-sm font-medium">{slug}</div>
              <div className="mt-1 text-xs text-white/50">Open →</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
