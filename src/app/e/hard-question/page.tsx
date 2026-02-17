'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useQuestion } from './hooks/useQuestion'
import { useAnswer } from './hooks/useAnswer'
import { QuestionDisplay } from './components/QuestionDisplay'
import { AnswerInput } from './components/AnswerInput'
import { PhilosopherReveal } from './components/PhilosopherReveal'
import { FavoriteButton } from './components/FavoriteButton'
import { Comments } from '@/components/comments/Comments'

type PageState = 'loading' | 'no-question' | 'question' | 'answering' | 'revealed'

export default function HardQuestionPage() {
  const { userId, loading: authLoading } = useAuth()
  const { data: todayData, loading: questionLoading, error: questionError } = useQuestion()
  const { submitAnswer, submitting, result, error: answerError } = useAnswer()
  const [pageState, setPageState] = useState<PageState>('loading')

  // Determine page state from data
  useEffect(() => {
    if (questionLoading) {
      setPageState('loading')
      return
    }

    if (!todayData?.question) {
      setPageState('no-question')
      return
    }

    if (result) {
      setPageState('revealed')
      return
    }

    if (todayData.has_answered) {
      // Already answered but we don't have result data — show question state
      // (In a full app, we'd re-fetch the similarities)
      setPageState('question')
      return
    }

    setPageState('question')
  }, [questionLoading, todayData, result])

  async function handleSubmit(answerText: string) {
    if (!todayData?.question) return
    setPageState('answering')
    const res = await submitAnswer(todayData.question.id, answerText)
    if (res) {
      setPageState('revealed')
    } else {
      setPageState('question')
    }
  }

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          Loading…
        </p>
      </div>
    )
  }

  // No question state
  if (pageState === 'no-question') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <h1
          className="text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
        >
          No question today
        </h1>
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
        >
          Come back tomorrow for a new question.
        </p>
      </div>
    )
  }

  const question = todayData!.question!
  const isAuthenticated = !!userId
  const isRevealed = pageState === 'revealed' && result
  const hasAnswered = todayData!.has_answered

  return (
    <div className="mx-auto max-w-4xl">
      {/* Question */}
      <div className="flex items-start">
        <div className="flex-1">
          <QuestionDisplay
            questionText={question.question_text}
            dayNumber={todayData!.day_number}
          />
        </div>
        {isAuthenticated && (
          <div className="pt-6 pr-4">
            <FavoriteButton questionId={question.id} />
          </div>
        )}
      </div>

      {/* Error display */}
      {(questionError || answerError) && (
        <div className="px-4 pb-4">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-mono)', color: '#C47878' }}
          >
            {questionError || answerError}
          </p>
        </div>
      )}

      {/* Answer input (hide if already answered or revealed) */}
      {!hasAnswered && !isRevealed && (
        <AnswerInput
          onSubmit={handleSubmit}
          submitting={submitting}
          disabled={pageState === 'answering'}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Philosopher reveal */}
      {isRevealed && (
        <>
          <PhilosopherReveal
            matches={result.similarities}
            visible={true}
          />

          {/* Link to fingerprint */}
          {isAuthenticated && (
            <div className="px-4 py-6">
              <Link
                href="/e/hard-question/fingerprint"
                className="inline-block text-sm transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                View your philosophical fingerprint →
              </Link>
            </div>
          )}
        </>
      )}

      {/* Comments */}
      <div className="px-4 py-8" style={{ borderTop: '1px solid var(--border)' }}>
        <Comments slug="hard-question" />
      </div>
    </div>
  )
}
