'use client'

import { HQ_HELPER_TEXT_SOFT } from '../lib/ui-colors'

interface QuestionDisplayProps {
  questionText: string
  dayNumber: number
}

export function QuestionDisplay({ questionText, dayNumber }: QuestionDisplayProps) {
  return (
    <div className="relative px-4 py-16 md:py-24">
      {/* Day counter */}
      <div
        className="absolute top-6 right-4 text-xs tracking-wider"
        style={{
          fontFamily: 'var(--font-mono)',
          color: HQ_HELPER_TEXT_SOFT,
        }}
      >
        Day {dayNumber}
      </div>

      {/* The question */}
      <h1
        className="question-fade-in max-w-3xl"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          lineHeight: 1.1,
          color: 'var(--fg)',
          fontWeight: 400,
        }}
      >
        {questionText}
      </h1>

      <style jsx>{`
        .question-fade-in {
          animation: questionFadeIn 1.2s ease-out both;
        }
        @keyframes questionFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .question-fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
