'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuestion } from './hooks/useQuestion'
import { useAnswer } from './hooks/useAnswer'
import { useLeaderboard } from './hooks/useLeaderboard'
import { QuestionCard } from './components/QuestionCard'
import { AnswerInput } from './components/AnswerInput'
import { ScoreReveal } from './components/ScoreReveal'
import { JudgeCommentary } from './components/JudgeCommentary'
import { Leaderboard } from './components/Leaderboard'
import { ShareCard } from './components/ShareCard'
import { GameModeToggle } from './components/GameModeToggle'
import { Comments } from '@/components/comments/Comments'
import { ExperimentNav } from '@/components/ExperimentNav'
import type { GameMode, GameState } from './lib/types'

export default function WrongAnswerPage() {
  const { userId } = useAuth()
  const [mode, setMode] = useState<GameMode>('daily')
  const [gameState, setGameState] = useState<GameState>('idle')
  const [submittedText, setSubmittedText] = useState('')

  const questionMode = mode === 'quick' ? 'random' : 'daily'
  const { question, loading: questionLoading, error: questionError, refetch } = useQuestion(questionMode)
  const { submit, submitting, result, error: answerError } = useAnswer()
  const { entries: leaderboardEntries, loading: leaderboardLoading } = useLeaderboard()

  const handleModeChange = useCallback((newMode: GameMode) => {
    setMode(newMode)
    setGameState('idle')
    setSubmittedText('')
  }, [])

  const handleSubmit = useCallback(async (text: string) => {
    if (!question) return
    setSubmittedText(text)
    setGameState('judging')
    await submit(question.id, text, mode === 'daily')
    setGameState('results')
  }, [question, mode, submit])

  const handlePlayAgain = useCallback(() => {
    setGameState('idle')
    setSubmittedText('')
    if (mode === 'quick') {
      refetch()
    }
  }, [mode, refetch])

  return (
    <div className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl tracking-tight text-white font-[family-name:var(--font-display)]">
            The{' '}
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(90deg, #ff3333, #ff8833, #ffcc33, #33ff88, #3388ff, #8833ff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                backgroundSize: '200% 100%',
                animation: 'rainbow-shift 4s linear infinite',
              }}
            >
              Wrong
            </span>{' '}
            Answer
          </h1>
          <p className="mt-3 text-sm font-[family-name:var(--font-body)] text-white/50 leading-relaxed max-w-lg">
            A quiz where only wrong answers score points. The more creatively,
            confidently, and hilariously wrong you are, the higher the Judge
            rates you.
          </p>

          {!userId && mode === 'daily' && (
            <p className="mt-2 text-xs font-[family-name:var(--font-mono)] text-white/30">
              Sign in to appear on the daily leaderboard.
            </p>
          )}

          <div className="mt-4 h-px w-16 bg-white/20" />
        </header>

        {/* Game Mode Toggle */}
        <div className="mb-8">
          <GameModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        {/* Question Area */}
        {questionLoading && (
          <div className="border-2 border-white/10 p-8 text-center">
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-white/30 animate-pulse">
              Loading question...
            </p>
          </div>
        )}

        {questionError && (
          <div className="border-2 border-[#ff3333]/40 p-6">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[#ff3333]">
              {questionError}
            </p>
            <button
              onClick={refetch}
              className="mt-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {question && !questionLoading && (
          <>
            <QuestionCard question={question} />

            {/* Answer Input (visible during idle state) */}
            {gameState === 'idle' && (
              <div className="mt-6">
                <AnswerInput
                  onSubmit={handleSubmit}
                  disabled={false}
                  loading={false}
                />
              </div>
            )}

            {/* Judging State */}
            {gameState === 'judging' && !result && (
              <div className="mt-8 text-center">
                <p
                  className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-white/40 animate-pulse"
                >
                  The Judge is deliberating...
                </p>
              </div>
            )}

            {/* Results */}
            {gameState === 'results' && result && (
              <div className="mt-8 space-y-6">
                <ScoreReveal result={result} />

                <JudgeCommentary
                  commentary={result.judge_commentary}
                  delay={4500}
                />

                <ShareCard
                  result={result}
                  question={question}
                  answerText={submittedText}
                />

                {/* Play Again */}
                <div className="text-center pt-4">
                  <button
                    onClick={handlePlayAgain}
                    className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest border-2 border-white/20 px-6 py-3 text-white/60 hover:text-white hover:border-white/40 transition-all min-h-[44px]"
                  >
                    {mode === 'quick' ? 'New Question' : 'Back to Question'}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {answerError && (
              <div className="mt-4 border-2 border-[#ff3333]/40 p-4">
                <p className="font-[family-name:var(--font-mono)] text-sm text-[#ff3333]">
                  {answerError}
                </p>
                <button
                  onClick={() => setGameState('idle')}
                  className="mt-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </>
        )}

        {/* Leaderboard (daily mode only) */}
        {mode === 'daily' && (
          <div className="mt-12">
            <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-white/30 mb-4">
              Today&apos;s Leaderboard
            </h2>
            {leaderboardLoading ? (
              <p className="font-[family-name:var(--font-mono)] text-xs text-white/20 animate-pulse">
                Loading leaderboard...
              </p>
            ) : (
              <Leaderboard entries={leaderboardEntries} />
            )}
          </div>
        )}

        {/* Comments */}
        <div className="mt-16">
          <Comments slug="wrong-answer" />
        </div>

        {/* Nav */}
        <div className="mt-12">
          <ExperimentNav />
        </div>
      </div>

      {/* Global animations */}
      <style jsx global>{`
        @keyframes rainbow-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  )
}
