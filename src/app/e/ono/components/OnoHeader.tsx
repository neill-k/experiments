'use client'

import Link from 'next/link'
import { ONO } from '@/lib/ono/constants'

export function OnoHeader() {
  return (
    <header className="border-b px-4 py-6 sm:px-6" style={{ borderColor: ONO.border }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline gap-3">
          <Link
            href="/e/ono"
            className="font-[family-name:var(--font-mono)] text-2xl sm:text-3xl tracking-tight transition-colors hover:opacity-80"
            style={{ color: ONO.amber }}
          >
            O(no)
          </Link>
          <span
            className="hidden text-xs sm:inline font-[family-name:var(--font-mono)]"
            style={{ color: ONO.textMuted }}
          >
            {ONO.tagline}
          </span>
        </div>
        <nav className="mt-3 flex gap-4">
          {[
            { href: '/e/ono', label: 'Problems' },
            { href: '/e/ono/leaderboard', label: 'Hall of Shame' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest transition-colors"
              style={{ color: ONO.textSecondary }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
