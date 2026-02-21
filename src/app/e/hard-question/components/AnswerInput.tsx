'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT, HQ_HELPER_TEXT_SUBTLE } from '../lib/ui-colors'

interface AnswerInputProps {
  onSubmit: (text: string) => void
  submitting: boolean
  disabled: boolean
  isAuthenticated: boolean
  isPracticeMode?: boolean
  submitLabel?: string
}

/** Contextual hint based on word count to encourage deeper thinking. */
function getWritingHint(wordCount: number): string | null {
  if (wordCount === 0) return null
  if (wordCount < 10) return 'Just getting started'
  if (wordCount < 30) return 'Keep going'
  if (wordCount < 60) return 'Good start'
  if (wordCount < 120) return 'Solid depth'
  return 'Thorough'
}

export function AnswerInput({
  onSubmit,
  submitting,
  disabled,
  isAuthenticated,
  isPracticeMode = false,
  submitLabel = 'Submit',
}: AnswerInputProps) {
  const [text, setText] = useState('')
  const [showLearnMore, setShowLearnMore] = useState(false)
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
          placeholder={isPracticeMode ? 'Try a practice response...' : 'What do you think?'}
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
              color: HQ_HELPER_TEXT,
            }}
          >
            <span>
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
            {hint && (
              <>
                <span style={{ color: HQ_HELPER_TEXT_SUBTLE }}>·</span>
                <span>{hint}</span>
              </>
            )}
          </div>
        )}

        {/* Pre-submit data-use disclosure */}
        <div
          className="mt-4 border px-3 py-3"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <p
            className="text-xs leading-relaxed"
            style={{
              fontFamily: 'var(--font-body)',
              color: HQ_HELPER_TEXT,
            }}
          >
            By submitting, your answer is sent to OpenAI to generate a semantic embedding.
            {isPracticeMode
              ? ' This run is unranked and not added to your long-term fingerprint.'
              : isAuthenticated
                ? ' Signed-in answers are saved to your profile.'
                : ' Signed-out answers stay in this browser session only.'}
          </p>

          <button
            type="button"
            onClick={() => setShowLearnMore((value) => !value)}
            aria-expanded={showLearnMore}
            aria-controls="hard-question-disclosure-details"
            className="mt-2 text-xs transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              color: HQ_HELPER_TEXT_SOFT,
              borderBottom: '1px solid var(--border)',
            }}
          >
            {showLearnMore ? 'Hide details' : 'Learn more'}
          </button>

          {showLearnMore && (
            <div
              id="hard-question-disclosure-details"
              className="mt-3 border px-3 py-3"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: '#0f1013',
              }}
            >
              <ul
                className="space-y-2 text-xs"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: HQ_HELPER_TEXT_SOFT,
                }}
              >
                <li>• We use embeddings to estimate similarity, not to identify who you are.</li>
                <li>• Ranked submissions update your fingerprint by school-level alignment.</li>
                <li>• Practice Mode answers are intentionally excluded from ranking.</li>
                <li>• You can clear session-only fingerprint data from the fingerprint page.</li>
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {!isAuthenticated && (
              <p
                className="text-xs"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: HQ_HELPER_TEXT,
                }}
              >
                Sign in to save ranked answers beyond this session.
              </p>
            )}
            {isPracticeMode && (
              <p
                className="text-xs"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: HQ_HELPER_TEXT_SOFT,
                }}
              >
                Practice Mode is unranked by design.
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Keyboard hint */}
            <span
              className="hidden text-xs sm:inline"
              style={{
                fontFamily: 'var(--font-mono)',
                color: HQ_HELPER_TEXT_SOFT,
                opacity: text.trim() ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            >
              ⌘Enter
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
              {submitting ? 'Processing…' : submitLabel}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .answer-textarea::placeholder {
          color: ${HQ_HELPER_TEXT_SOFT};
          opacity: 1;
        }
        .answer-textarea:focus {
          border-bottom-color: var(--border-hover);
        }
        .answer-textarea:disabled {
          opacity: 0.55;
        }
        .submit-btn:hover:not(:disabled) {
          background-color: var(--border-hover);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
