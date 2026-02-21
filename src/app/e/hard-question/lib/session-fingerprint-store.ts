import { z } from 'zod'
import type {
  CorpusMatch,
  PerspectiveMatch,
  PhilosophicalFingerprint,
  PhilosophySchool,
} from './types'

const STORE_KEY = 'hq_session_store_v2'
const LEGACY_KEY = 'hq_session_matches'
const STORE_VERSION = 2
const ENTRY_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14 days
const MAX_ENTRIES = 240

type MatchSource = 'perspective' | 'corpus'

interface SessionMatchEntry {
  id: string
  source: MatchSource
  school: PhilosophySchool
  similarity: number
  question_id: string
  answer_key: string
  created_at: number
}

interface SessionPracticeUsage {
  day: string
  question_id: string
  used_at: number
}

interface SessionStore {
  version: number
  updated_at: number
  entries: SessionMatchEntry[]
  practice_usage: SessionPracticeUsage | null
}

const sessionEntrySchema = z.object({
  id: z.string(),
  source: z.enum(['perspective', 'corpus']),
  school: z.string(),
  similarity: z.number(),
  question_id: z.string(),
  answer_key: z.string(),
  created_at: z.number(),
})

const practiceUsageSchema = z.object({
  day: z.string(),
  question_id: z.string(),
  used_at: z.number(),
})

const sessionStoreSchema = z.object({
  version: z.number(),
  updated_at: z.number(),
  entries: z.array(sessionEntrySchema),
  practice_usage: practiceUsageSchema.nullable().optional().default(null),
})

function defaultStore(): SessionStore {
  return {
    version: STORE_VERSION,
    updated_at: Date.now(),
    entries: [],
    practice_usage: null,
  }
}

function normalizeSimilarity(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function normalizeEntries(entries: SessionMatchEntry[]): SessionMatchEntry[] {
  const now = Date.now()
  const cutoff = now - ENTRY_TTL_MS
  const deduped = new Map<string, SessionMatchEntry>()

  for (const raw of entries) {
    if (raw.created_at < cutoff) continue

    const entry: SessionMatchEntry = {
      ...raw,
      similarity: normalizeSimilarity(raw.similarity),
    }

    const existing = deduped.get(entry.id)
    if (!existing || existing.created_at < entry.created_at) {
      deduped.set(entry.id, entry)
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, MAX_ENTRIES)
}

function tryReadLegacyEntries(): SessionMatchEntry[] {
  try {
    const raw = sessionStorage.getItem(LEGACY_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const now = Date.now()
    const entries: SessionMatchEntry[] = []

    parsed.forEach((item, index) => {
      if (!item || typeof item !== 'object') return

      const school = (item as { school?: unknown }).school
      const similarity = (item as { similarity?: unknown }).similarity
      if (typeof school !== 'string' || typeof similarity !== 'number') return

      entries.push({
        id: `legacy:${index}:${school}:${Math.round(similarity * 1000)}`,
        source: 'perspective',
        school: school as PhilosophySchool,
        similarity: normalizeSimilarity(similarity),
        question_id: 'legacy',
        answer_key: 'legacy',
        created_at: now - (parsed.length - index) * 10,
      })
    })

    sessionStorage.removeItem(LEGACY_KEY)
    return entries
  } catch {
    return []
  }
}

function readStore(): SessionStore {
  if (typeof window === 'undefined') return defaultStore()

  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (!raw) {
      const migrated = normalizeEntries(tryReadLegacyEntries())
      const store = {
        ...defaultStore(),
        entries: migrated,
      }
      if (migrated.length > 0) {
        writeStore(store)
      }
      return store
    }

    const parsed = JSON.parse(raw)
    const validated = sessionStoreSchema.safeParse(parsed)
    if (!validated.success || validated.data.version !== STORE_VERSION) {
      return defaultStore()
    }

    const normalizedEntries = normalizeEntries(
      validated.data.entries.map((entry) => ({
        id: entry.id,
        source: entry.source,
        school: entry.school as PhilosophySchool,
        similarity: entry.similarity,
        question_id: entry.question_id,
        answer_key: entry.answer_key,
        created_at: entry.created_at,
      }))
    )

    const normalizedPractice =
      validated.data.practice_usage &&
      typeof validated.data.practice_usage.day === 'string' &&
      typeof validated.data.practice_usage.question_id === 'string' &&
      typeof validated.data.practice_usage.used_at === 'number'
        ? validated.data.practice_usage
        : null

    const normalizedStore: SessionStore = {
      version: STORE_VERSION,
      updated_at: Date.now(),
      entries: normalizedEntries,
      practice_usage: normalizedPractice,
    }

    const needsRewrite =
      normalizedEntries.length !== validated.data.entries.length ||
      normalizedPractice !== validated.data.practice_usage

    if (needsRewrite) {
      writeStore(normalizedStore)
    }

    return normalizedStore
  } catch {
    return defaultStore()
  }
}

function writeStore(store: SessionStore): void {
  if (typeof window === 'undefined') return

  try {
    const normalizedStore: SessionStore = {
      version: STORE_VERSION,
      updated_at: Date.now(),
      entries: normalizeEntries(store.entries),
      practice_usage: store.practice_usage,
    }

    sessionStorage.setItem(STORE_KEY, JSON.stringify(normalizedStore))
  } catch {
    // sessionStorage unavailable or full
  }
}

function buildEntryId(answerKey: string, source: MatchSource, matchId: string): string {
  return `${answerKey}:${source}:${matchId}`
}

function djb2Hash(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return Math.abs(hash >>> 0).toString(36)
}

export function buildSessionAnswerKey(questionId: string, answerText: string): string {
  const normalized = answerText.trim().toLowerCase().replace(/\s+/g, ' ')
  return `anon:${questionId}:${djb2Hash(normalized)}`
}

interface AppendSessionFingerprintMatchesInput {
  questionId: string
  answerKey: string
  perspectiveMatches: Pick<PerspectiveMatch, 'perspective_id' | 'school' | 'similarity'>[]
  corpusMatches: Pick<CorpusMatch, 'corpus_id' | 'school' | 'similarity'>[]
}

export function appendSessionFingerprintMatches(input: AppendSessionFingerprintMatchesInput): void {
  const store = readStore()
  const now = Date.now()

  const nextEntries: SessionMatchEntry[] = [
    ...input.perspectiveMatches.map((match) => ({
      id: buildEntryId(input.answerKey, 'perspective', match.perspective_id),
      source: 'perspective' as const,
      school: match.school,
      similarity: normalizeSimilarity(match.similarity),
      question_id: input.questionId,
      answer_key: input.answerKey,
      created_at: now,
    })),
    ...input.corpusMatches.map((match) => ({
      id: buildEntryId(input.answerKey, 'corpus', match.corpus_id),
      source: 'corpus' as const,
      school: match.school,
      similarity: normalizeSimilarity(match.similarity),
      question_id: input.questionId,
      answer_key: input.answerKey,
      created_at: now,
    })),
  ]

  writeStore({
    ...store,
    entries: [...store.entries, ...nextEntries],
  })
}

export function getSessionFingerprintEntries(): SessionMatchEntry[] {
  return readStore().entries
}

export function buildSessionFingerprint(): PhilosophicalFingerprint[] {
  const entries = getSessionFingerprintEntries()
  if (entries.length === 0) return []

  const bySchool = new Map<PhilosophySchool, number[]>()
  for (const entry of entries) {
    const scores = bySchool.get(entry.school) ?? []
    scores.push(entry.similarity)
    bySchool.set(entry.school, scores)
  }

  return Array.from(bySchool.entries()).map(([school, scores]) => {
    const avg = scores.reduce((total, value) => total + value, 0) / scores.length

    return {
      id: `session:${school}`,
      user_id: 'session',
      school,
      avg_score: avg,
      sample_count: scores.length,
      min_score: Math.min(...scores),
      max_score: Math.max(...scores),
      recent_avg: avg,
    }
  })
}

export function clearSessionFingerprintEntries(): void {
  const store = readStore()
  writeStore({
    ...store,
    entries: [],
  })
}

function getUtcDayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getSessionPracticeStatus(): {
  available: boolean
  remaining: 0 | 1
  used_question_id: string | null
} {
  const store = readStore()
  const today = getUtcDayKey()

  if (!store.practice_usage || store.practice_usage.day !== today) {
    return {
      available: true,
      remaining: 1,
      used_question_id: null,
    }
  }

  return {
    available: false,
    remaining: 0,
    used_question_id: store.practice_usage.question_id,
  }
}

export function markSessionPracticeUsed(questionId: string): void {
  const store = readStore()
  writeStore({
    ...store,
    practice_usage: {
      day: getUtcDayKey(),
      question_id: questionId,
      used_at: Date.now(),
    },
  })
}

export function clearSessionPracticeUsage(): void {
  const store = readStore()
  writeStore({
    ...store,
    practice_usage: null,
  })
}
