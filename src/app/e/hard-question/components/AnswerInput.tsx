'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

interface AnswerInputProps {
  onSubmit: (text: string) => void
  submitting: boolean
  disabled: boolean
  isAuthenticated: boolean
}

/** Contextual hint based on word count to encourage deeper thinking. */
function getWritingHint(wordCount: number): string | null {
  if (wordCount === 0) return null
  if (wordCount < 10) return 'Just getting started...'
  if (wordCount < 30) return 'Keep going'
  if (wordCount < 60) return 'Good start'
  if (wordCount < 120) return 'Solid depth'
  return 'Thorough'
}

export function AnswerInput({ onSubmit, submitting, disabled, isAuthenticated }: AnswerInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = useMemo(() => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
  }, [text])

  const hint = getWritingHint(wordCount)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`
  }, [text])

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || submitting || disabled) return
    onSubmit(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-4 pb-8">
      <div className="max-w-3xl">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you think?"
          disabled={disabled || submitting}
          rows={3}
          className="answer-textarea w-full resize-none bg-transparent pb-3 text-base leading-relaxed outline-none transition-colors"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--fg)',
            borderBottom: '1px solid var(--border)',
            minHeight: '80px',
          }}
        />

        {/* Word count + writing hint */}
        {wordCount > 0 && (
          <div
            className="mt-2 flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--muted)',
              opacity: 0.6,
            }}
          >
            <span>
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
            {hint && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{hint}</span>
              </>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <p
                className="text-xs"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                }}
              >
                Sign in to save your answer
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Keyboard hint */}
            <span
              className="hidden sm:inline text-xs"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted)',
                opacity: text.trim() ? 0.4 : 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              &#8984;Enter
            </span>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting || disabled}
              className="submit-btn px-6 py-3 text-sm font-medium tracking-wide transition-all"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--fg)',
                backgroundColor: 'var(--border)',
                border: '1px solid var(--border-hover)',
              }}
            >
              {submitting ? 'Thinking...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .answer-textarea::placeholder {
          color: var(--muted);
          opacity: 0.6;
        }
        .answer-textarea:focus {
          border-bottom-color: var(--border-hover);
        }
        .answer-textarea:disabled {
          opacity: 0.5;
        }
        .submit-btn:hover:not(:disabled) {
          background-color: var(--border-hover);
        }
        .submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
