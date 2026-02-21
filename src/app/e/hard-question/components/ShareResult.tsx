'use client'

import { useState, useCallback } from 'react'
import type { PerspectiveMatch } from '../lib/types'
import { HQ_HELPER_TEXT_SOFT } from '../lib/ui-colors'

interface ShareResultProps {
  matches: PerspectiveMatch[]
  dayNumber: number
}

export function ShareResult({ matches, dayNumber }: ShareResultProps) {
  const [copied, setCopied] = useState(false)

  const topMatch = matches[0]
  if (!topMatch) return null

  const shareText = `Day ${dayNumber} — my answer aligned most with ${topMatch.philosopher_name} (${Math.round(topMatch.similarity * 100)}% semantic match). What did you get?`
  const shareUrl = 'https://experiments.neillkillgore.com/e/hard-question'

  const handleShare = useCallback(async () => {
    // Try native Web Share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'The Hard Question',
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled or share failed - fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    const fullText = `${shareText}\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API failed - do nothing
    }
  }, [shareText, shareUrl])

  return (
    <button
      onClick={handleShare}
      className="share-result-btn inline-flex items-center gap-2 px-4 py-2 text-xs tracking-wide transition-all"
      style={{
        fontFamily: 'var(--font-mono)',
        color: copied ? 'var(--fg)' : HQ_HELPER_TEXT_SOFT,
        backgroundColor: 'transparent',
        border: `1px solid ${copied ? 'var(--border-hover)' : 'var(--border)'}`,
      }}
    >
      {copied ? (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share result
        </>
      )}

      <style jsx>{`
        .share-result-btn:hover {
          border-color: var(--border-hover);
          color: var(--fg);
        }
      `}</style>
    </button>
  )
}
