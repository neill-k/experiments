'use client'

import { useState, useRef, useEffect } from 'react'

interface AnswerInputProps {
  onSubmit: (text: string) => void
  submitting: boolean
  disabled: boolean
  isAuthenticated: boolean
}

export function AnswerInput({ onSubmit, submitting, disabled, isAuthenticated }: AnswerInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

        <div className="mt-4 flex items-center justify-between">
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

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting || disabled}
            className="submit-btn ml-auto px-6 py-3 text-sm font-medium tracking-wide transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
              backgroundColor: 'var(--border)',
              border: '1px solid var(--border-hover)',
            }}
          >
            {submitting ? 'Thinking…' : 'Submit'}
          </button>
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
