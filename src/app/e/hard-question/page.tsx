'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Comments } from '@/components/comments/Comments'
import { ExperimentNav } from '@/components/ExperimentNav'
import { useAuth } from '@/hooks/useAuth'
import { AnswerInput } from './components/AnswerInput'
import { CorpusReveal } from './components/CorpusReveal'
import { FavoriteButton } from './components/FavoriteButton'
import { PhilosopherReveal } from './components/PhilosopherReveal'
import { ProcessingReveal } from './components/ProcessingReveal'
import { QuestionDisplay } from './components/QuestionDisplay'
import { useAnswer } from './hooks/useAnswer'
import { usePreviousResult } from './hooks/usePreviousResult'
import { useQuestion } from './hooks/useQuestion'
import { useReducedMotion } from './hooks/useReducedMotion'
import {
  getSessionPracticeStatus,
  markSessionPracticeUsed,
} from './lib/session-fingerprint-store'
import { HQ_ERROR_TEXT, HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT } from './lib/ui-colors'

type SubmissionPhase = 'idle' | 'submitting' | 'processing'

export default function HardQuestionPage() {
  const searchParams = useSearchParams()
  const selectedQuestionId = searchParams.get('question')
  const wantsPracticeMode = searchParams.get('mode') === 'practice'

  const { userId } = useAuth()
  const isAuthenticated = !!userId
  const reducedMotion = useReducedMotion()

  const {
    data: todayData,
    loading: questionLoading,
    error: questionError,
  } = useQuestion(selectedQuestionId)

  const {
    submitAnswer,
    submitting,
    result,
    error: answerError,
    clearResult,
  } = useAnswer({ trackSessionFingerprint: !isAuthenticated })

  // Fetch previous results when user has already answered.
  const questionIdForPrevious =
    todayData?.has_answered && todayData?.question ? todayData.question.id : null
  const { data: previousResult, loading: previousLoading } =
    usePreviousResult(questionIdForPrevious)

  const [submissionPhase, setSubmissionPhase] = useState<SubmissionPhase>('idle')
  const [showReveal, setShowReveal] = useState(false)
  const [showCorpus, setShowCorpus] = useState(false)
  const [sessionPracticeStatus, setSessionPracticeStatus] = useState(() =>
    getSessionPracticeStatus()
  )
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const timersRef = useRef<number[]>([])

  const question = todayData?.question ?? null
  const hasAnswered = todayData?.has_answered ?? false
  const isArchiveQuestion = Boolean(question && !todayData?.is_today)

  const needsPracticeMode = Boolean(
    question && isArchiveQuestion && !hasAnswered && !wantsPracticeMode
  )

  const isPracticeMode = Boolean(
    question && isArchiveQuestion && !hasAnswered && wantsPracticeMode
  )

  const practiceAvailable = isPracticeMode
    ? isAuthenticated
      ? (todayData?.practice?.available ?? true)
      : sessionPracticeStatus.available
    : true

  const revealPayload = result ?? previousResult

  const displaySimilarities = revealPayload?.similarities ?? []
  const displayCorpusMatches = revealPayload?.corpus_matches ?? []

  const isRevealed = showReveal && displaySimilarities.length > 0
  const isReturningUser = hasAnswered && !result

  const isPremium = (result?.tier ?? todayData?.tier) === 'paid'

  // Reset reveal orchestration when the active question changes.
  useEffect(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []

    clearResult()
    setSubmissionPhase('idle')
    setShowReveal(false)
    setShowCorpus(false)
    setPracticeError(null)
    setSessionPracticeStatus(getSessionPracticeStatus())
  }, [question?.id, clearResult])

  // Returning users: show existing reveal immediately once loaded.
  useEffect(() => {
    if (previousResult && !result) {
      setShowReveal(true)
      setShowCorpus(true)
    }
  }, [previousResult, result])

  // Cleanup timers on unmount.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const loading = questionLoading || (hasAnswered && !result && previousLoading)

  async function handleSubmit(answerText: string) {
    if (!question) return

    setPracticeError(null)

    if (needsPracticeMode) {
      setPracticeError('Archive questions can only be submitted in Practice Mode.')
      return
    }

    if (isPracticeMode && !practiceAvailable) {
      setPracticeError('Practice Mode is already used for today.')
      return
    }

    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []

    setShowReveal(false)
    setShowCorpus(false)
    setSubmissionPhase('submitting')

    const response = await submitAnswer(question.id, answerText, {
      practiceMode: isPracticeMode,
    })

    if (!response) {
      setSubmissionPhase('idle')
      return
    }

    if (isPracticeMode && !isAuthenticated) {
      markSessionPracticeUsed(question.id)
      setSessionPracticeStatus(getSessionPracticeStatus())
    }

    const runPremiumChoreo = response.tier === 'paid' && !response.practice_mode && !reducedMotion

    if (runPremiumChoreo) {
      setSubmissionPhase('processing')

      const revealTimer = window.setTimeout(() => {
        setSubmissionPhase('idle')
        setShowReveal(true)
      }, 700)

      const corpusTimer = window.setTimeout(() => {
        setShowCorpus(true)
      }, 1300)

      timersRef.current = [revealTimer, corpusTimer]
      return
    }

    setSubmissionPhase('idle')
    setShowReveal(true)
    setShowCorpus(true)
  }

  const showAnswerInput =
    !!question &&
    !hasAnswered &&
    !isRevealed &&
    submissionPhase === 'idle' &&
    !needsPracticeMode &&
    practiceAvailable

  const showProcessingPanel = submissionPhase !== 'idle' || submitting

  const errorMessage = questionError || answerError || practiceError

  const modeSummary = useMemo(() => {
    if (!question) return null
    if (!isArchiveQuestion) return null

    if (isPracticeMode) {
      return 'Practice Mode · unranked archive run'
    }

    if (hasAnswered) {
      return 'Archive review · showing your saved reveal'
    }

    return 'Archive question · launch in Practice Mode to play'
  }, [question, isArchiveQuestion, isPracticeMode, hasAnswered])

  // Loading state.
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <div className="pb-2">
          <div className="h-3 w-3/4 max-w-lg animate-pulse bg-white/[0.06]" />
          <div className="mt-2 h-3 w-1/2 max-w-sm animate-pulse bg-white/[0.05]" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-2 w-16 animate-pulse bg-white/[0.07]" />
          <div className="h-8 w-full max-w-xl animate-pulse bg-white/[0.06]" />
          <div className="h-8 w-2/3 max-w-md animate-pulse bg-white/[0.05]" />
        </div>
        <div className="mt-8">
          <div
            className="h-20 w-full animate-pulse bg-white/[0.04]"
            style={{ borderBottom: '1px solid var(--border)' }}
          />
          <div className="mt-4 flex justify-end">
            <div className="h-10 w-24 animate-pulse bg-white/[0.06]" />
          </div>
        </div>
      </div>
    )
  }

  // No question state.
  if (!question) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 px-4 pb-8 pt-12">
          <div className="text-center">
            <h1
              className="text-3xl"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
            >
              No question today
            </h1>
            <p
              className="mt-3 max-w-md text-sm"
              style={{ fontFamily: 'var(--font-body)', color: HQ_HELPER_TEXT }}
            >
              New questions appear daily. While you wait, explore the archive or check your
              alignment pattern.
            </p>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/e/hard-question/archive"
              className="px-5 py-2.5 text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--fg)',
                border: '1px solid var(--border)',
              }}
            >
              Browse past questions
            </Link>
            <Link
              href="/e/hard-question/fingerprint"
              className="px-5 py-2.5 text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: HQ_HELPER_TEXT_SOFT,
                border: '1px solid var(--border)',
              }}
            >
              Your alignment pattern
            </Link>
          </div>
        </div>

        <div className="px-4 py-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Comments slug="hard-question" />
        </div>

        <ExperimentNav />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Intro */}
      {!isRevealed && !hasAnswered && (
        <div className="px-4 pb-2 pt-8">
          <p
            className="max-w-2xl text-sm leading-relaxed"
            style={{
              fontFamily: 'var(--font-body)',
              color: HQ_HELPER_TEXT,
            }}
          >
            One hard question a day. Write what you actually think, not what sounds smart.
            Your answer is compared to philosopher passages using semantic similarity.
            The result is probabilistic alignment, not identity.
          </p>
          <Link
            href="/e/hard-question/archive"
            className="mt-2 inline-block text-xs transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              color: HQ_HELPER_TEXT_SOFT,
            }}
          >
            Browse past questions &rarr;
          </Link>
        </div>
      )}

      {/* Archive / practice mode context */}
      {modeSummary && (
        <div className="px-4 pb-2">
          <p
            className="inline-block border px-3 py-1 text-[11px] uppercase tracking-[0.12em]"
            style={{
              fontFamily: 'var(--font-mono)',
              color: HQ_HELPER_TEXT_SOFT,
              borderColor: 'var(--border)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            {modeSummary}
          </p>
        </div>
      )}

      {/* Question */}
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          <QuestionDisplay questionText={question.question_text} dayNumber={todayData?.day_number ?? 0} />
        </div>
        {isAuthenticated && (
          <div className="shrink-0 px-4 pt-6">
            <FavoriteButton questionId={question.id} />
          </div>
        )}
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="px-4 pb-4">
          <p className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: HQ_ERROR_TEXT }}>
            {errorMessage}
          </p>
        </div>
      )}

      {/* Practice mode gate */}
      {needsPracticeMode && !hasAnswered && (
        <div className="px-4 pb-8">
          <div
            className="max-w-3xl border px-4 py-4"
            style={{ borderColor: 'var(--border)', backgroundColor: '#111216' }}
          >
            <p
              className="text-sm"
              style={{ fontFamily: 'var(--font-body)', color: HQ_HELPER_TEXT }}
            >
              Archive questions are playable via Practice Mode so they stay unranked.
            </p>
            <Link
              href={`/e/hard-question?question=${question.id}&mode=practice`}
              className="mt-3 inline-block border px-3 py-1.5 text-xs uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--fg)',
                borderColor: 'var(--border-hover)',
              }}
            >
              Start Practice Mode
            </Link>
          </div>
        </div>
      )}

      {/* Practice limit notice */}
      {isPracticeMode && !practiceAvailable && !result && (
        <div className="px-4 pb-8">
          <div
            className="max-w-3xl border px-4 py-4"
            style={{ borderColor: 'var(--border)', backgroundColor: '#111216' }}
          >
            <p
              className="text-sm"
              style={{ fontFamily: 'var(--font-body)', color: HQ_HELPER_TEXT }}
            >
              Practice Mode is already used for today.
              {isAuthenticated
                ? ' Come back tomorrow for another unranked archive run.'
                : ' In this browser session, Practice Mode resets tomorrow (UTC).'}
            </p>
            <Link
              href="/e/hard-question/archive"
              className="mt-3 inline-block text-xs"
              style={{
                fontFamily: 'var(--font-mono)',
                color: HQ_HELPER_TEXT_SOFT,
                borderBottom: '1px solid var(--border)',
              }}
            >
              Back to archive
            </Link>
          </div>
        </div>
      )}

      {/* Answer input */}
      {showAnswerInput && (
        <AnswerInput
          onSubmit={handleSubmit}
          submitting={submitting || submissionPhase !== 'idle'}
          disabled={submissionPhase !== 'idle'}
          isAuthenticated={isAuthenticated}
          isPracticeMode={isPracticeMode}
          submitLabel={isPracticeMode ? 'Run practice match' : 'Submit'}
        />
      )}

      {/* Processing panel */}
      {showProcessingPanel && (
        <ProcessingReveal
          premium={isPremium}
          phase={submissionPhase === 'processing' ? 'processing' : 'submitting'}
          practiceMode={isPracticeMode}
        />
      )}

      {/* Returning user note */}
      {isRevealed && isReturningUser && (
        <div className="px-4 pb-2">
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              color: HQ_HELPER_TEXT_SOFT,
            }}
          >
            You answered this one earlier. Here&apos;s the same full reveal, including corpus matches:
          </p>
        </div>
      )}

      {/* Philosopher reveal */}
      {displaySimilarities.length > 0 && (
        <>
          <PhilosopherReveal
            matches={displaySimilarities}
            visible={showReveal}
            dayNumber={todayData?.day_number}
            practiceMode={isPracticeMode}
          />

          {/* Corpus matches */}
          {displayCorpusMatches.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <CorpusReveal matches={displayCorpusMatches} visible={showCorpus} />
            </div>
          )}

          {/* Links to fingerprint and archive */}
          {isRevealed && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-6">
              <Link
                href="/e/hard-question/fingerprint"
                className="inline-block text-sm transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: HQ_HELPER_TEXT_SOFT,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                View your alignment pattern →
              </Link>
              <Link
                href="/e/hard-question/archive"
                className="inline-block text-sm transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: HQ_HELPER_TEXT_SOFT,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Browse past questions →
              </Link>
            </div>
          )}
        </>
      )}

      {/* Comments */}
      <div className="px-4 py-8" style={{ borderTop: '1px solid var(--border)' }}>
        <Comments slug="hard-question" />
      </div>

      <ExperimentNav />
    </div>
  )
}
