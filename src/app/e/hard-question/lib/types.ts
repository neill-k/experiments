/** Philosophy schools matching the Supabase enum */
export type PhilosophySchool =
  | 'stoicism'
  | 'existentialism'
  | 'utilitarianism'
  | 'deontology'
  | 'absurdism'
  | 'pragmatism'
  | 'virtue_ethics'
  | 'nihilism'
  | 'phenomenology'
  | 'rationalism'
  | 'empiricism'
  | 'taoism'
  | 'buddhist_philosophy'
  | 'ubuntu'

export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type SubscriptionTier = 'free' | 'paid'

export interface Question {
  id: string
  question_text: string
  context: string | null
  category: string
  difficulty: QuestionDifficulty
  published_date: string | null
  source: string | null
  created_at: string
}

export interface PhilosopherPerspective {
  id: string
  question_id: string
  philosopher_name: string
  school: PhilosophySchool
  perspective_text: string
  summary: string | null
  source?: string
  sort_order: number
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  answer_text: string
  created_at: string
}

export interface SimilarityScore {
  id: string
  user_answer_id: string
  perspective_id: string
  score: number
  school: PhilosophySchool
}

export interface PhilosophicalFingerprint {
  id: string
  user_id: string
  school: PhilosophySchool
  avg_score: number
  sample_count: number
  min_score: number | null
  max_score: number | null
  recent_avg: number | null
}

export interface UserFavorite {
  id: string
  user_id: string
  question_id: string
  created_at: string
}

/** API response: today's question */
export interface TodayResponse {
  question: Question | null
  has_answered: boolean
  answer_id: string | null
  day_number: number
}

/** API response: answer submission */
export interface AnswerResponse {
  answer_id: string
  similarities: PerspectiveMatch[]
}

/** A single philosopher match with similarity score */
export interface PerspectiveMatch {
  perspective_id: string
  philosopher_name: string
  school: PhilosophySchool
  perspective_text: string
  summary: string | null
  source?: string
  similarity: number
}

/** API response: fingerprint data */
export interface FingerprintResponse {
  fingerprint: PhilosophicalFingerprint[]
  total_answers: number
}

/** Seed data format for a question with perspectives */
export interface SeedQuestion {
  question_text: string
  context: string
  category: string
  difficulty: QuestionDifficulty
  perspectives: SeedPerspective[]
}

export interface SeedPerspective {
  philosopher_name: string
  school: PhilosophySchool
  perspective_text: string
  summary: string
  source: string
  sort_order: number
}
