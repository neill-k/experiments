'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AuthButtons } from './AuthButtons'

const navLinks = [
  { href: '/e/the-blob', label: 'The Blob' },
  { href: '/e/prompt-library', label: 'Prompts' },
  { href: '/e/agent-spec-builder', label: 'Agent Spec' },
]

export function NavBar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isHome = pathname === '/'

  return (
    <nav className="fixed top-3 left-3 right-3 z-50 sm:top-4 sm:left-4 sm:right-4 md:left-auto md:right-auto md:inset-x-0 md:mx-auto md:max-w-4xl pointer-events-none">
      <div className="nav-glass pointer-events-auto relative">
        {/* Animated gradient border */}
        <div className="nav-border-glow" aria-hidden="true" />

        <div className="relative flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5 sm:py-3">
          {/* Logo / Home */}
          <Link
            href="/"
            className="group flex items-center gap-2 shrink-0"
          >
            <span className="nav-logo-mark" aria-hidden="true">✒️</span>
            <span className="font-[family-name:var(--font-display)] text-base sm:text-lg text-white/90 group-hover:text-white transition-colors">
              Experiments
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right side: auth + mobile menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <AuthButtons />
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden flex flex-col gap-[3px] p-1.5 text-white/50 hover:text-white/80 transition-colors"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              <span className={`block h-px w-4 bg-current transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
              <span className={`block h-px w-4 bg-current transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-4 bg-current transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-white/[0.06] px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2 px-2 text-sm font-[family-name:var(--font-mono)] tracking-wide transition-colors ${
                    isActive
                      ? 'text-white bg-white/[0.06]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="pt-2 border-t border-white/[0.06]">
              <AuthButtons />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
