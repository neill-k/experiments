export interface Question {
  id: string
  text: string
  correct_answer: string
  category: string
}

export interface ScoreBreakdown {
  conviction: number
  consistency: number
  comedy: number
  creativity: number
  plausibility: number
}

export interface AnswerResult {
  id: string
  scores: ScoreBreakdown
  total_score: number
  judge_commentary: string
}

export interface LeaderboardEntry {
  rank: number
  answer_text: string
  total_score: number
  scores: ScoreBreakdown
  judge_commentary: string
  user_id?: string
}

export type GameMode = 'quick' | 'daily'
export type GameState = 'idle' | 'answering' | 'judging' | 'results'

export type ScoreTier = 'pathetic' | 'weak' | 'decent' | 'impressive' | 'legendary'
