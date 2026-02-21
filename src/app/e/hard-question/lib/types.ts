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
  | 'confucianism'

export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type SubscriptionTier = 'free' | 'paid'

export interface PracticeStatus {
  available: boolean
  remaining: 0 | 1
  used_question_id: string | null
}

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
  source?: string | null
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

/** API response: today's question or a selected archive question */
export interface TodayResponse {
  question: Question | null
  has_answered: boolean
  answer_id: string | null
  day_number: number
  tier: SubscriptionTier
  is_today: boolean
  practice: PracticeStatus | null
}

/** API response: answer submission */
export interface AnswerResponse {
  answer_id: string | null
  similarities: PerspectiveMatch[]
  corpus_matches: CorpusMatch[]
  saved: boolean
  tier: SubscriptionTier
  practice_mode: boolean
  ranked: boolean
}

/** A corpus match from the full philosopher library */
export interface CorpusMatch {
  corpus_id: string
  philosopher: string
  school: PhilosophySchool
  work: string
  section: string | null
  passage_text: string
  similarity: number
}

/** A single philosopher match with similarity score */
export interface PerspectiveMatch {
  perspective_id: string
  philosopher_name: string
  school: PhilosophySchool
  perspective_text: string
  summary: string | null
  source?: string | null
  similarity: number
}

/** API response: previous reveal payload for answered questions */
export interface PreviousResultResponse {
  perspectives: PerspectiveMatch[]
  corpus_matches: CorpusMatch[]
  tier: SubscriptionTier
  total_count: number
}

/** API response: fingerprint data */
export interface FingerprintResponse {
  fingerprint: PhilosophicalFingerprint[]
  total_answers: number
}

/** API response: archive listing */
export interface ArchiveQuestion {
  id: string
  question_text: string
  category: string
  difficulty: string
  published_date: string
  has_answered: boolean
}

export interface ArchiveResponse {
  questions: ArchiveQuestion[]
  page: number
  per_page: number
  total: number
  total_pages: number
  practice: PracticeStatus | null
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
