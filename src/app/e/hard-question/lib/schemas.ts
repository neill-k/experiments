import { z } from 'zod'

export const philosophySchoolValues = [
  'stoicism',
  'existentialism',
  'utilitarianism',
  'deontology',
  'absurdism',
  'pragmatism',
  'virtue_ethics',
  'nihilism',
  'phenomenology',
  'rationalism',
  'empiricism',
  'taoism',
  'buddhist_philosophy',
  'ubuntu',
  'confucianism',
] as const

export const philosophySchoolSchema = z.enum(philosophySchoolValues)
export const subscriptionTierSchema = z.enum(['free', 'paid'])
export const questionDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])

export const questionSchema = z.object({
  id: z.string(),
  question_text: z.string(),
  context: z.string().nullable().optional().default(null),
  category: z.string(),
  difficulty: questionDifficultySchema,
  published_date: z.string().nullable().optional().default(null),
  source: z.string().nullable().optional().default(null),
  created_at: z.string(),
})

export const perspectiveMatchSchema = z.object({
  perspective_id: z.string(),
  philosopher_name: z.string(),
  school: philosophySchoolSchema,
  perspective_text: z.string().optional().default(''),
  summary: z.string().nullable().optional().default(null),
  source: z.string().nullable().optional().default(null),
  similarity: z.number().optional().default(0),
})

export const corpusMatchSchema = z.object({
  corpus_id: z.string(),
  philosopher: z.string(),
  school: philosophySchoolSchema,
  work: z.string(),
  section: z.string().nullable().optional().default(null),
  passage_text: z.string(),
  similarity: z.number(),
})

export const practiceStatusSchema = z.object({
  available: z.boolean(),
  remaining: z.union([z.literal(0), z.literal(1)]),
  used_question_id: z.string().nullable().optional().default(null),
})

export const todayResponseSchema = z.object({
  question: questionSchema.nullable(),
  has_answered: z.boolean(),
  answer_id: z.string().nullable(),
  day_number: z.number().int().nonnegative(),
  tier: subscriptionTierSchema.optional().default('free'),
  is_today: z.boolean().optional().default(true),
  practice: practiceStatusSchema.nullable().optional().default(null),
})

export const answerResponseSchema = z.object({
  answer_id: z.string().nullable().optional().default(null),
  similarities: z.array(perspectiveMatchSchema),
  corpus_matches: z.array(corpusMatchSchema).optional().default([]),
  saved: z.boolean().optional().default(false),
  tier: subscriptionTierSchema.optional().default('free'),
  practice_mode: z.boolean().optional().default(false),
  ranked: z.boolean().optional().default(true),
})

export const perspectivesResponseSchema = z.object({
  perspectives: z.array(perspectiveMatchSchema),
  corpus_matches: z.array(corpusMatchSchema).optional().default([]),
  tier: subscriptionTierSchema.optional().default('free'),
  total_count: z.number().int().nonnegative().optional().default(0),
})

export const philosophicalFingerprintSchema = z.object({
  id: z.string().optional().default(''),
  user_id: z.string().optional().default(''),
  school: philosophySchoolSchema,
  avg_score: z.number(),
  sample_count: z.number().int().nonnegative(),
  min_score: z.number().nullable().optional().default(null),
  max_score: z.number().nullable().optional().default(null),
  recent_avg: z.number().nullable().optional().default(null),
})

export const fingerprintResponseSchema = z.object({
  fingerprint: z.array(philosophicalFingerprintSchema),
  total_answers: z.number().int().nonnegative(),
})

export const archiveQuestionSchema = z.object({
  id: z.string(),
  question_text: z.string(),
  category: z.string(),
  difficulty: z.string(),
  published_date: z.string(),
  has_answered: z.boolean(),
})

export const archiveResponseSchema = z.object({
  questions: z.array(archiveQuestionSchema),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
  practice: practiceStatusSchema.nullable().optional().default(null),
})

export type TodayResponseSchema = z.infer<typeof todayResponseSchema>
export type AnswerResponseSchema = z.infer<typeof answerResponseSchema>
export type PerspectivesResponseSchema = z.infer<typeof perspectivesResponseSchema>
export type FingerprintResponseSchema = z.infer<typeof fingerprintResponseSchema>
export type ArchiveResponseSchema = z.infer<typeof archiveResponseSchema>
