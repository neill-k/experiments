'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useQuestion } from './hooks/useQuestion'
import { useAnswer } from './hooks/useAnswer'
import { usePreviousResult } from './hooks/usePreviousResult'
import { QuestionDisplay } from './components/QuestionDisplay'
import { AnswerInput } from './components/AnswerInput'
import { PhilosopherReveal } from './components/PhilosopherReveal'
import { CorpusReveal } from './components/CorpusReveal'
import { FavoriteButton } from './components/FavoriteButton'
import { Comments } from '@/components/comments/Comments'
import { ExperimentNav } from '@/components/ExperimentNav'

type PageState = 'loading' | 'no-question' | 'question' | 'answering' | 'revealed'

export default function HardQuestionPage() {
  const { userId, loading: authLoading } = useAuth()
  const { data: todayData, loading: questionLoading, error: questionError } = useQuestion()
  const { submitAnswer, submitting, result, error: answerError } = useAnswer()
  const [pageState, setPageState] = useState<PageState>('loading')

  // Fetch previous results when user has already answered
  const questionIdForPrevious =
    todayData?.has_answered && todayData?.question ? todayData.question.id : null
  const { data: previousResult, loading: previousLoading } =
    usePreviousResult(questionIdForPrevious)

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

    // Fresh submission result takes priority
    if (result) {
      setPageState('revealed')
      return
    }

    // Already answered - show previous results once loaded
    if (todayData.has_answered && previousResult) {
      setPageState('revealed')
      return
    }

    // Still loading previous results for a returning user
    if (todayData.has_answered && previousLoading) {
      setPageState('loading')
      return
    }

    setPageState('question')
  }, [questionLoading, todayData, result, previousResult, previousLoading])

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

  // The similarities to display - prefer fresh result, fall back to previous
  const displaySimilarities = result?.similarities ?? previousResult?.similarities ?? []

  // Corpus matches - only available on fresh submissions
  const displayCorpusMatches = result?.corpus_matches ?? []

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
  const isRevealed = pageState === 'revealed' && displaySimilarities.length > 0
  const hasAnswered = todayData!.has_answered
  const isReturningUser = hasAnswered && !result

  return (
    <div className="mx-auto max-w-4xl">
      {/* Intro - only show before answering */}
      {!isRevealed && !hasAnswered && (
        <div className="px-4 pt-8 pb-2">
          <p
            className="max-w-2xl text-sm leading-relaxed"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--muted)',
            }}
          >
            One hard question a day. Write what you actually think, not what sounds smart.
            Your answer is matched against real quotes from real philosophers using semantic
            similarity. Over time, a philosophical fingerprint emerges: the schools of thought
            your mind naturally gravitates toward.
          </p>
          <Link
            href="/e/hard-question/archive"
            className="mt-2 inline-block text-xs transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255, 255, 255, 0.25)',
            }}
          >
            Browse past questions &rarr;
          </Link>
        </div>
      )}

      {/* Question */}
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          <QuestionDisplay
            questionText={question.question_text}
            dayNumber={todayData!.day_number}
          />
        </div>
        {isAuthenticated && (
          <div className="shrink-0 pt-6 pr-4">
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

      {/* Returning user note */}
      {isRevealed && isReturningUser && (
        <div className="px-4 pb-2">
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
            }}
          >
            You answered this one earlier. Here&apos;s how you matched:
          </p>
        </div>
      )}

      {/* Philosopher reveal */}
      {isRevealed && (
        <>
          <PhilosopherReveal
            matches={displaySimilarities}
            visible={true}
            dayNumber={todayData!.day_number}
          />

          {/* Corpus matches - "From the library" */}
          {displayCorpusMatches.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <CorpusReveal
                matches={displayCorpusMatches}
                visible={true}
              />
            </div>
          )}

          {/* Links to fingerprint and archive */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-6">
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
            <Link
              href="/e/hard-question/archive"
              className="inline-block text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              Browse past questions →
            </Link>
          </div>
        </>
      )}

      {/* Comments */}
      <div className="px-4 py-8" style={{ borderTop: '1px solid var(--border)' }}>
        <Comments slug="hard-question" />
      </div>

      {/* Prev/Next experiment navigation */}
      <ExperimentNav />
    </div>
  )
}
