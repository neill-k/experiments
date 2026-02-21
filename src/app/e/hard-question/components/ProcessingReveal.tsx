'use client'

import { HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT } from '../lib/ui-colors'

interface ProcessingRevealProps {
  premium: boolean
  phase: 'submitting' | 'processing'
  practiceMode: boolean
}

export function ProcessingReveal({ premium, phase, practiceMode }: ProcessingRevealProps) {
  const title =
    phase === 'submitting'
      ? 'Analyzing your answer'
      : premium
        ? 'Preparing your premium reveal'
        : 'Preparing your reveal'

  const subtitle = practiceMode
    ? 'Practice run only — this result will stay unranked.'
    : premium
      ? 'Running perspective + corpus matching before reveal.'
      : 'Running semantic similarity matching.'

  return (
    <div className="px-4 pb-8" role="status" aria-live="polite">
      <div
        className="processing-shell max-w-3xl border px-4 py-4"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: '#111216',
        }}
      >
        <p
          className="text-sm"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--fg)',
          }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            color: HQ_HELPER_TEXT,
          }}
        >
          {subtitle}
        </p>

        <div
          className="progress-track mt-3 h-[2px] overflow-hidden"
          style={{ backgroundColor: 'var(--border)' }}
          aria-hidden="true"
        >
          <div className="progress-indicator h-full" />
        </div>

        {premium && (
          <ol
            className="mt-3 space-y-1.5 text-[11px]"
            style={{
              fontFamily: 'var(--font-mono)',
              color: HQ_HELPER_TEXT_SOFT,
            }}
          >
            <li>1. Compute semantic embedding</li>
            <li>2. Score against question perspectives</li>
            <li>3. Pull highest resonance corpus passages</li>
          </ol>
        )}
      </div>

      <style jsx>{`
        .processing-shell {
          animation: shell-enter 240ms ease-out both;
        }

        .progress-indicator {
          width: 45%;
          background: linear-gradient(90deg, transparent, var(--fg), transparent);
          animation: scan 1.1s linear infinite;
        }

        @keyframes shell-enter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scan {
          from {
            transform: translateX(-120%);
          }
          to {
            transform: translateX(320%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .processing-shell {
            animation: none;
          }

          .progress-indicator {
            animation: none;
            width: 100%;
            transform: none;
            background: var(--fg);
            opacity: 0.55;
          }
        }
      `}</style>
    </div>
  )
}
