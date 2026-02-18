'use client'

import type { Question } from '../lib/types'
import { CategoryStamp } from './CategoryStamp'

export function QuestionCard({ question }: { question: Question }) {
  return (
    <div
      className="relative border-2 border-[#ebebeb] p-6 sm:p-8 animate-[fade-in_0.4s_ease-out]"
      style={{ backgroundColor: '#08080a' }}
    >
      {/* Category stamp in top-right */}
      <div className="absolute top-4 right-4">
        <CategoryStamp category={question.category} />
      </div>

      {/* Question text */}
      <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[#ebebeb] leading-snug pr-24 sm:pr-32 mb-8">
        {question.text}
      </p>

      {/* Correct answer section */}
      <div className="border-t border-[#ebebeb]/20 pt-4">
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40 block mb-1">
          THE CORRECT ANSWER:
        </span>
        <span className="font-[family-name:var(--font-body)] text-lg text-[#ebebeb]/70">
          {question.correct_answer}
        </span>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
