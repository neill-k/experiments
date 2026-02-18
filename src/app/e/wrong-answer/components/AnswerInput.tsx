'use client'

import { useState } from 'react'

const MAX_CHARS = 500

function getCounterColor(length: number): string {
  const ratio = length / MAX_CHARS
  if (ratio < 0.7) return '#33ff88'
  if (ratio < 0.9) return '#ffcc33'
  return '#ff3333'
}

interface AnswerInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  loading?: boolean
}

export function AnswerInput({ onSubmit, disabled, loading }: AnswerInputProps) {
  const [text, setText] = useState('')

  const canSubmit = text.trim().length > 0 && !disabled && !loading

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(text.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder="Give us your best wrong answer..."
          rows={4}
          className="w-full border-2 border-[#ebebeb]/40 bg-transparent text-[#ebebeb] font-[family-name:var(--font-body)] text-base p-4 resize-none placeholder:text-[#ebebeb]/20 focus:border-[#ebebeb] focus:outline-none disabled:opacity-40 transition-colors"
        />

        {/* Character counter */}
        <span
          className="absolute bottom-3 right-3 font-[family-name:var(--font-mono)] text-xs transition-colors"
          style={{ color: getCounterColor(text.length) }}
        >
          {text.length}/{MAX_CHARS}
        </span>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full min-h-[44px] border-2 border-[#ebebeb] bg-[#ebebeb] text-[#08080a] font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest font-bold py-3 px-6 transition-all hover:bg-transparent hover:text-[#ebebeb] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#ebebeb] disabled:hover:text-[#08080a]"
      >
        {loading ? (
          <span className="animate-pulse">THE JUDGE IS DELIBERATING...</span>
        ) : (
          'SUBMIT TO THE JUDGE'
        )}
      </button>
    </div>
  )
}
