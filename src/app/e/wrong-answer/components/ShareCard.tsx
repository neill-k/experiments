'use client'

import { useState } from 'react'
import type { AnswerResult, Question } from '../lib/types'
import { getScoreColor, getScoreLabel, getScoreTier } from '../lib/score-colors'

interface ShareCardProps {
  result: AnswerResult
  question: Question
  answerText: string
}

export function ShareCard({ result, question, answerText }: ShareCardProps) {
  const [copied, setCopied] = useState(false)
  const tier = getScoreTier(result.total_score)
  const isLegendary = tier === 'legendary'
  const scoreColor = getScoreColor(result.total_score)

  async function handleShare() {
    const url = window.location.href
    const text = `I scored ${result.total_score}/100 (${getScoreLabel(result.total_score)}) on The Wrong Answer Game!`

    // Try native share first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Certificate of Wrongness', text, url })
        return
      } catch {
        // User cancelled or not supported; fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="border-2 border-[#ebebeb] p-6 sm:p-8 space-y-6" style={{ backgroundColor: '#08080a' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-[#ebebeb]/20 pb-4">
        <h3 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[#ebebeb]/40 mb-2">
          Official Document
        </h3>
        <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[#ebebeb]">
          Certificate of Wrongness
        </h2>
      </div>

      {/* Question */}
      <div>
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40 block mb-1">
          QUESTION:
        </span>
        <p className="font-[family-name:var(--font-display)] text-lg text-[#ebebeb]/80">
          {question.text}
        </p>
      </div>

      {/* Answer */}
      <div>
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40 block mb-1">
          THE DEFENDANT ANSWERED:
        </span>
        <p className="font-[family-name:var(--font-body)] text-base text-[#ebebeb]">
          {answerText}
        </p>
      </div>

      {/* Score */}
      <div className="text-center py-4 border-y-2 border-[#ebebeb]/20">
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40 block mb-2">
          VERDICT
        </span>
        <span
          className="font-[family-name:var(--font-mono)] text-5xl font-bold block"
          style={{
            color: isLegendary ? '#ff3333' : scoreColor,
            animation: isLegendary ? 'rainbow-share 2s linear infinite' : undefined,
          }}
        >
          {result.total_score}/100
        </span>
        <span
          className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.3em] mt-2 block"
          style={{ color: scoreColor }}
        >
          {getScoreLabel(result.total_score)}
        </span>
      </div>

      {/* Commentary */}
      <div>
        <p className="font-[family-name:var(--font-body)] text-sm italic text-[#ebebeb]/50">
          &ldquo;{result.judge_commentary}&rdquo;
        </p>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full min-h-[44px] border-2 border-[#ebebeb] bg-[#ebebeb] text-[#08080a] font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest font-bold py-3 px-6 transition-all hover:bg-transparent hover:text-[#ebebeb]"
      >
        {copied ? 'COPIED TO CLIPBOARD' : 'SHARE YOUR WRONGNESS'}
      </button>

      <style>{`
        @keyframes rainbow-share {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
