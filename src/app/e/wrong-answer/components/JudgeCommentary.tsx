'use client'

import { useState, useEffect } from 'react'

interface JudgeCommentaryProps {
  commentary: string
  delay?: number
}

export function JudgeCommentary({ commentary, delay = 0 }: JudgeCommentaryProps) {
  const [visible, setVisible] = useState(false)
  const [displayedChars, setDisplayedChars] = useState(0)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(showTimer)
  }, [delay])

  useEffect(() => {
    if (!visible) return

    if (displayedChars >= commentary.length) return

    const charTimer = setTimeout(() => {
      setDisplayedChars((prev) => prev + 1)
    }, 30)

    return () => clearTimeout(charTimer)
  }, [visible, displayedChars, commentary.length])

  return (
    <div
      className="transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="border-l-2 border-[#ebebeb]/20 pl-4 py-2">
        {/* Opening quote */}
        <span
          className="font-[family-name:var(--font-display)] text-4xl text-[#ebebeb]/20 leading-none block -mb-4"
        >
          &ldquo;
        </span>

        {/* Typewriter text */}
        <p className="font-[family-name:var(--font-body)] text-base italic text-[#ebebeb]/60 min-h-[3em]">
          {commentary.slice(0, displayedChars)}
          {displayedChars < commentary.length && (
            <span className="animate-pulse">|</span>
          )}
        </p>

        {/* Closing quote */}
        {displayedChars >= commentary.length && (
          <span className="font-[family-name:var(--font-display)] text-4xl text-[#ebebeb]/20 leading-none block text-right -mt-4">
            &rdquo;
          </span>
        )}
      </div>

      <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/30 mt-2 block">
        -- The Judge
      </span>
    </div>
  )
}
