'use client'

import Link from 'next/link'

export default function ArchivePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4">
      <h1
        className="text-3xl md:text-4xl"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--fg)',
          fontWeight: 400,
        }}
      >
        Archive
      </h1>

      <p
        className="max-w-md text-center leading-relaxed"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--muted)',
          fontSize: '1rem',
        }}
      >
        The full archive of past questions is coming soon.
        It&apos;ll be available for paid subscribers.
      </p>

      <Link
        href="/e/hard-question"
        className="mt-4 text-xs transition-colors"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--muted)',
        }}
      >
        ← Back to today&apos;s question
      </Link>
    </div>
  )
}
