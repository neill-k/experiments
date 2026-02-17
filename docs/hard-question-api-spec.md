# The Hard Question — API & Embedding Pipeline Specification

## Overview

A daily philosophy app where users answer a question, their response is embedded via OpenAI, and cosine similarity is calculated against pre-embedded philosopher perspectives. Over time, users build a "philosophical fingerprint" — a profile of which schools of thought they most align with.

---

## Table of Contents

1. [Database Schema (pgvector)](#1-database-schema)
2. [File Structure](#2-file-structure)
3. [Shared Utilities](#3-shared-utilities)
4. [Embedding Pipeline](#4-embedding-pipeline)
5. [API Routes](#5-api-routes)
6. [Error Handling Patterns](#6-error-handling-patterns)
7. [Rate Limiting](#7-rate-limiting)
8. [RLS Policies](#8-rls-policies)

---

## 1. Database Schema

### Migration: `20260217_hard_question_schema.sql`

```sql
-- Enable pgvector extension (must be done by superuser / via Supabase dashboard)
create extension if not exists vector;

-- ============================================================
-- ENUMS
-- ============================================================

create type subscription_tier as enum ('free', 'paid');

-- ============================================================
-- TABLES
-- ============================================================

-- Users profile (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  subscription_tier subscription_tier not null default 'free',
  stripe_customer_id text,          -- for future Stripe integration
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daily questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null unique,  -- the date this question is shown
  question_text text not null,
  context text,                          -- optional background/framing
  category text,                         -- e.g. "Ethics", "Epistemology", "Metaphysics"
  created_at timestamptz not null default now()
);

create index questions_scheduled_date_idx on public.questions (scheduled_date);

-- Philosopher perspectives (pre-seeded with embeddings)
create table public.perspectives (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  philosopher_name text not null,        -- e.g. "Aristotle", "Simone de Beauvoir"
  school text not null,                  -- e.g. "Stoicism", "Existentialism", "Utilitarianism"
  perspective_text text not null,        -- the philosopher's answer/position
  embedding vector(1536) not null,       -- pre-computed at seed time
  created_at timestamptz not null default now()
);

create index perspectives_question_id_idx on public.perspectives (question_id);

-- User answers (1 per user per question, enforced by unique constraint)
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text not null,
  embedding vector(1536) not null,       -- computed at submit time via OpenAI
  created_at timestamptz not null default now(),

  constraint answers_one_per_user_per_question unique (user_id, question_id)
);

create index answers_user_id_idx on public.answers (user_id);
create index answers_question_id_idx on public.answers (question_id);

-- Similarity scores (computed at submit time, stored for fast reads)
create table public.similarity_scores (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  perspective_id uuid not null references public.perspectives(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  score float8 not null,                 -- cosine similarity [-1, 1]
  created_at timestamptz not null default now(),

  constraint similarity_scores_unique unique (answer_id, perspective_id)
);

create index similarity_scores_user_id_idx on public.similarity_scores (user_id);
create index similarity_scores_question_id_idx on public.similarity_scores (question_id);

-- Favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint favorites_unique unique (user_id, question_id)
);

-- ============================================================
-- FUNCTIONS (cosine similarity via pgvector)
-- ============================================================

-- pgvector provides the <=> operator for cosine distance.
-- cosine_similarity = 1 - cosine_distance
-- We'll use this in the route handler via a raw SQL call.

-- Helper function: compute similarity between an answer embedding and all perspectives for a question
create or replace function compute_similarities(
  p_answer_embedding vector(1536),
  p_question_id uuid
)
returns table (
  perspective_id uuid,
  philosopher_name text,
  school text,
  perspective_text text,
  score float8
)
language sql
stable
as $$
  select
    p.id as perspective_id,
    p.philosopher_name,
    p.school,
    p.perspective_text,
    1 - (p.embedding <=> p_answer_embedding) as score
  from public.perspectives p
  where p.question_id = p_question_id
  order by score desc;
$$;

-- Helper function: compute philosophical fingerprint for a user
create or replace function get_fingerprint(p_user_id uuid)
returns table (
  school text,
  avg_score float8,
  question_count bigint
)
language sql
stable
as $$
  select
    p.school,
    avg(ss.score) as avg_score,
    count(distinct ss.question_id) as question_count
  from public.similarity_scores ss
  join public.perspectives p on p.id = ss.perspective_id
  where ss.user_id = p_user_id
  group by p.school
  order by avg_score desc;
$$;
```

### Why pgvector for similarity?

- **Performance**: `<=>` operator is optimized and runs in Postgres — no round-trip to JS for vector math
- **Correctness**: pgvector's cosine distance is well-tested
- **Simplicity**: One SQL call computes all similarities for a question
- **Scalability**: Can add IVFFlat or HNSW indexes later if needed

---

## 2. File Structure

```
src/app/api/
├── hard-question/
│   ├── _lib/
│   │   ├── auth.ts              # requireUser() helper — extracts & validates user from request
│   │   ├── openai.ts            # getEmbedding() — calls OpenAI text-embedding-3-small
│   │   ├── subscription.ts      # getSubscriptionTier() — checks user's tier
│   │   └── errors.ts            # Standardized error responses
│   ├── question/
│   │   └── route.ts             # GET — today's question
│   ├── question/[date]/
│   │   └── route.ts             # GET — question by date (archive, paid only)
│   ├── answer/
│   │   └── route.ts             # POST — submit answer
│   ├── perspectives/[questionId]/
│   │   └── route.ts             # GET — perspectives + similarity scores
│   ├── fingerprint/
│   │   └── route.ts             # GET — philosophical fingerprint
│   ├── archive/
│   │   └── route.ts             # GET — browse past questions
│   ├── favorites/
│   │   └── route.ts             # GET, POST, DELETE — manage favorites
│   ├── subscription/
│   │   └── route.ts             # GET, PATCH — check/manage subscription
│   └── admin/
│       └── seed/
│           └── route.ts         # POST — seed questions (admin only)
```

---

## 3. Shared Utilities

### `src/app/api/hard-question/_lib/auth.ts`

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

export type AuthUser = {
  id: string
  email?: string
}

/**
 * Extract and validate user from the Authorization header.
 * Uses supabaseFromAccessToken to verify the JWT, then returns the user.
 */
export async function requireUser(req: Request): Promise<
  | { user: AuthUser }
  | { error: NextResponse }
> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.slice(7)
  const supabase = supabaseFromAccessToken(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }

  return { user: { id: user.id, email: user.email } }
}

/**
 * Verify the request comes from an admin user.
 * For MVP: check against ADMIN_USER_IDS env var (comma-separated UUIDs).
 */
export async function requireAdmin(req: Request): Promise<
  | { user: AuthUser }
  | { error: NextResponse }
> {
  const auth = await requireUser(req)
  if ('error' in auth) return auth

  const adminIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim())
  if (!adminIds.includes(auth.user.id)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      ),
    }
  }

  return auth
}
```

### `src/app/api/hard-question/_lib/openai.ts`

```typescript
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings'
const MODEL = 'text-embedding-3-small'   // 1536 dimensions

/**
 * Compute an embedding vector for the given text.
 * Runs server-side only — never expose OPENAI_API_KEY to the client.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI embedding failed (${res.status}): ${body}`)
  }

  const json = await res.json()
  return json.data[0].embedding as number[]
}

/**
 * Compute embeddings for multiple texts in a single API call (batch).
 * Used at seed time for efficiency.
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  // OpenAI supports batch input — up to ~2048 items per call
  const BATCH_SIZE = 100
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: batch,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`OpenAI embedding failed (${res.status}): ${body}`)
    }

    const json = await res.json()
    // OpenAI returns embeddings sorted by index
    const sorted = json.data.sort((a: any, b: any) => a.index - b.index)
    results.push(...sorted.map((d: any) => d.embedding))
  }

  return results
}
```

### `src/app/api/hard-question/_lib/subscription.ts`

```typescript
import { supabaseAdmin } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'paid'

/**
 * Get the subscription tier for a user.
 * Creates a profile if one doesn't exist (defaults to 'free').
 */
export async function getSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    // Auto-create profile on first access
    await admin.from('profiles').insert({ id: userId, subscription_tier: 'free' })
    return 'free'
  }

  return data.subscription_tier as SubscriptionTier
}
```

### `src/app/api/hard-question/_lib/errors.ts`

```typescript
import { NextResponse } from 'next/server'

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

export function tooManyRequests(message = 'Too many requests', resetAt?: number) {
  return NextResponse.json(
    { error: message, ...(resetAt ? { resetAt } : {}) },
    { status: 429 }
  )
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 })
}
```

---

## 4. Embedding Pipeline

### Seed Time (Admin Import)

```
Admin POST /api/hard-question/admin/seed
  ↓
  Validate admin auth
  ↓
  Parse question + perspectives JSON
  ↓
  Batch all perspective texts → OpenAI text-embedding-3-small
  ↓
  Insert question row
  ↓
  Insert perspective rows WITH pre-computed embeddings
  ↓
  Return { inserted: N }
```

**Key**: Perspective embeddings are computed **once** at seed time and stored in `perspectives.embedding`. They are never recomputed.

### Runtime (User Answer Submission)

```
User POST /api/hard-question/answer
  ↓
  Validate auth + rate limit (1 answer per question per user)
  ↓
  Send answer_text → OpenAI text-embedding-3-small (single text)
  ↓
  Insert answer row WITH embedding
  ↓
  Call Postgres function compute_similarities(embedding, question_id)
    → pgvector <=> operator computes cosine distance for each perspective
    → returns (perspective_id, philosopher_name, school, score)
  ↓
  Bulk insert similarity_scores rows
  ↓
  Return top match (free) or all matches (paid)
```

### Cosine Similarity Calculation

**Approach: Postgres pgvector operator `<=>`**

```sql
-- cosine_distance = embedding1 <=> embedding2
-- cosine_similarity = 1 - cosine_distance
SELECT
  p.id,
  p.philosopher_name,
  p.school,
  1 - (p.embedding <=> $1) as score
FROM perspectives p
WHERE p.question_id = $2
ORDER BY score DESC;
```

**Why not JS?**
- Avoids pulling 1536-float vectors over the wire
- pgvector's `<=>` is a single CPU instruction per dimension (SIMD-optimized)
- Keeps the hot path in the database

---

## 5. API Routes

---

### 5.1 `GET /api/hard-question/question`

**Get today's question.**

| Field | Value |
|-------|-------|
| Auth | Required (Bearer token) |
| Tier gating | None — all tiers see today's question |

#### Request

No body. No query params.

#### Response `200`

```json
{
  "question": {
    "id": "uuid",
    "scheduledDate": "2026-02-17",
    "questionText": "Is it ever ethical to lie?",
    "context": "Consider white lies, lies of omission, and noble lies...",
    "category": "Ethics"
  },
  "hasAnswered": true,
  "isFavorited": false
}
```

`hasAnswered` — lets the client know whether to show the answer form or the results.

#### Response `404`

```json
{ "error": "No question scheduled for today" }
```

#### Implementation Notes

```typescript
// Get today's date in UTC
const today = new Date().toISOString().slice(0, 10)

// Query
const { data: question } = await admin
  .from('questions')
  .select('id, scheduled_date, question_text, context, category')
  .eq('scheduled_date', today)
  .maybeSingle()

// Check if user has already answered
const { data: answer } = await admin
  .from('answers')
  .select('id')
  .eq('user_id', user.id)
  .eq('question_id', question.id)
  .maybeSingle()

// Check if favorited
const { data: fav } = await admin
  .from('favorites')
  .select('id')
  .eq('user_id', user.id)
  .eq('question_id', question.id)
  .maybeSingle()
```

---

### 5.2 `POST /api/hard-question/answer`

**Submit an answer. Computes embedding, calculates similarities, stores everything.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | None (all tiers can answer) |
| Rate limit | 1 answer per question per user (DB constraint) |

#### Request

```json
{
  "questionId": "uuid",
  "answerText": "I believe lying is sometimes necessary to protect..."
}
```

#### Validation

- `questionId`: required, valid UUID, must reference existing question
- `answerText`: required, 1–5000 characters
- User must not have already answered this question

#### Response `201`

```json
{
  "answer": {
    "id": "uuid",
    "questionId": "uuid",
    "answerText": "I believe lying is sometimes necessary...",
    "createdAt": "2026-02-17T12:00:00Z"
  },
  "topMatch": {
    "philosopherName": "Aristotle",
    "school": "Virtue Ethics",
    "score": 0.87,
    "perspectiveText": "Aristotle would argue that the virtuous person..."
  },
  "allMatches": null
}
```

**Tier gating on response:**
- **Free**: `topMatch` populated, `allMatches` is `null`
- **Paid**: `topMatch` populated, `allMatches` is full array:

```json
{
  "allMatches": [
    {
      "perspectiveId": "uuid",
      "philosopherName": "Aristotle",
      "school": "Virtue Ethics",
      "score": 0.87,
      "perspectiveText": "Aristotle would argue..."
    },
    {
      "perspectiveId": "uuid",
      "philosopherName": "Kant",
      "school": "Deontology",
      "score": 0.72,
      "perspectiveText": "Kant would insist that lying..."
    }
  ]
}
```

#### Response `409`

```json
{ "error": "You have already answered this question" }
```

#### Response `400`

```json
{ "error": "answerText is required and must be 1-5000 characters" }
```

#### Implementation (pseudocode)

```typescript
// 1. Validate input
// 2. Check for existing answer (DB constraint will also catch this)
// 3. Compute embedding via OpenAI
const embedding = await getEmbedding(body.answerText)

// 4. Insert answer with embedding
const { data: answer } = await admin
  .from('answers')
  .insert({
    user_id: user.id,
    question_id: body.questionId,
    answer_text: body.answerText,
    embedding: JSON.stringify(embedding),  // pgvector accepts JSON array
  })
  .select('id, question_id, answer_text, created_at')
  .single()

// 5. Compute similarities via Postgres function
const { data: similarities } = await admin.rpc('compute_similarities', {
  p_answer_embedding: JSON.stringify(embedding),
  p_question_id: body.questionId,
})

// 6. Bulk insert similarity scores
const scoreRows = similarities.map((s: any) => ({
  answer_id: answer.id,
  perspective_id: s.perspective_id,
  user_id: user.id,
  question_id: body.questionId,
  score: s.score,
}))
await admin.from('similarity_scores').insert(scoreRows)

// 7. Return gated response
const tier = await getSubscriptionTier(user.id)
const topMatch = similarities[0]
```

---

### 5.3 `GET /api/hard-question/perspectives/[questionId]`

**Get philosopher perspectives with similarity scores for a question the user has answered.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | Free: top match only. Paid: all matches. |

#### Request

URL param: `questionId` (UUID)

#### Response `200` (Free Tier)

```json
{
  "questionId": "uuid",
  "questionText": "Is it ever ethical to lie?",
  "userAnswer": "I believe lying is sometimes necessary...",
  "tier": "free",
  "topMatch": {
    "perspectiveId": "uuid",
    "philosopherName": "Aristotle",
    "school": "Virtue Ethics",
    "score": 0.87,
    "perspectiveText": "Aristotle would argue that..."
  },
  "otherMatches": [
    {
      "perspectiveId": "uuid",
      "philosopherName": "Kant",
      "school": "Deontology",
      "score": null,
      "perspectiveText": null
    },
    {
      "perspectiveId": "uuid",
      "philosopherName": "Mill",
      "school": "Utilitarianism",
      "score": null,
      "perspectiveText": null
    }
  ],
  "totalPerspectives": 5
}
```

Free tier: `otherMatches` shows philosopher names and schools (tease) but scores and text are `null`. Client renders these as locked/blurred.

#### Response `200` (Paid Tier)

```json
{
  "questionId": "uuid",
  "questionText": "Is it ever ethical to lie?",
  "userAnswer": "I believe lying is sometimes necessary...",
  "tier": "paid",
  "topMatch": {
    "perspectiveId": "uuid",
    "philosopherName": "Aristotle",
    "school": "Virtue Ethics",
    "score": 0.87,
    "perspectiveText": "Aristotle would argue that..."
  },
  "otherMatches": [
    {
      "perspectiveId": "uuid",
      "philosopherName": "Kant",
      "school": "Deontology",
      "score": 0.72,
      "perspectiveText": "Kant would insist that lying is always wrong..."
    }
  ],
  "totalPerspectives": 5
}
```

#### Response `403`

```json
{ "error": "You must answer this question before viewing perspectives" }
```

---

### 5.4 `GET /api/hard-question/fingerprint`

**Get the user's philosophical fingerprint — aggregate similarity profile across all answered questions.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | Free: top 3 schools. Paid: all schools + detailed breakdown. |

#### Request

No body. Optional query param: `?detailed=true` (paid only — includes per-question breakdown).

#### Response `200` (Free)

```json
{
  "tier": "free",
  "totalQuestionsAnswered": 12,
  "schools": [
    { "school": "Virtue Ethics", "avgScore": 0.82, "questionCount": 12 },
    { "school": "Existentialism", "avgScore": 0.76, "questionCount": 10 },
    { "school": "Stoicism", "avgScore": 0.71, "questionCount": 8 }
  ],
  "allSchools": null
}
```

Free: only top 3 schools. `allSchools` is `null`.

#### Response `200` (Paid)

```json
{
  "tier": "paid",
  "totalQuestionsAnswered": 12,
  "schools": [
    { "school": "Virtue Ethics", "avgScore": 0.82, "questionCount": 12 },
    { "school": "Existentialism", "avgScore": 0.76, "questionCount": 10 },
    { "school": "Stoicism", "avgScore": 0.71, "questionCount": 8 },
    { "school": "Utilitarianism", "avgScore": 0.65, "questionCount": 12 },
    { "school": "Deontology", "avgScore": 0.58, "questionCount": 11 },
    { "school": "Pragmatism", "avgScore": 0.54, "questionCount": 7 }
  ],
  "allSchools": null
}
```

When `?detailed=true` (paid only):

```json
{
  "tier": "paid",
  "totalQuestionsAnswered": 12,
  "schools": [ ... ],
  "breakdown": [
    {
      "questionId": "uuid",
      "questionText": "Is it ever ethical to lie?",
      "date": "2026-02-17",
      "scores": [
        { "school": "Virtue Ethics", "score": 0.87 },
        { "school": "Deontology", "score": 0.72 }
      ]
    }
  ]
}
```

#### Implementation

```typescript
// Uses the get_fingerprint Postgres function
const { data: schools } = await admin.rpc('get_fingerprint', {
  p_user_id: user.id,
})

const tier = await getSubscriptionTier(user.id)
const totalAnswered = await admin
  .from('answers')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)

// Gate the response
const schoolsToReturn = tier === 'free' ? schools.slice(0, 3) : schools
```

---

### 5.5 `GET /api/hard-question/archive`

**Browse past questions.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | **Paid only**. Free users get a 403 with upsell message. |

#### Request

Query params:
- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `50`)
- `category` (optional, filter by category)

#### Response `200` (Paid)

```json
{
  "questions": [
    {
      "id": "uuid",
      "scheduledDate": "2026-02-16",
      "questionText": "What is the meaning of suffering?",
      "category": "Existentialism",
      "hasAnswered": true,
      "isFavorited": false
    },
    {
      "id": "uuid",
      "scheduledDate": "2026-02-15",
      "questionText": "Do we have free will?",
      "category": "Metaphysics",
      "hasAnswered": false,
      "isFavorited": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Response `403` (Free)

```json
{
  "error": "Archive access requires a paid subscription",
  "upgradeUrl": "/upgrade"
}
```

---

### 5.6 `GET /api/hard-question/favorites`

**List favorited questions.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | None |

#### Request

Query params:
- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `50`)

#### Response `200`

```json
{
  "favorites": [
    {
      "questionId": "uuid",
      "scheduledDate": "2026-02-15",
      "questionText": "Do we have free will?",
      "category": "Metaphysics",
      "favoritedAt": "2026-02-15T14:30:00Z",
      "hasAnswered": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### 5.7 `POST /api/hard-question/favorites`

**Add a question to favorites.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | None |

#### Request

```json
{
  "questionId": "uuid"
}
```

#### Response `201`

```json
{ "ok": true, "questionId": "uuid" }
```

#### Response `409`

```json
{ "error": "Already favorited" }
```

---

### 5.8 `DELETE /api/hard-question/favorites`

**Remove a question from favorites.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | None |

#### Request

```json
{
  "questionId": "uuid"
}
```

#### Response `200`

```json
{ "ok": true, "questionId": "uuid" }
```

#### Response `404`

```json
{ "error": "Favorite not found" }
```

---

### 5.9 `GET /api/hard-question/subscription`

**Check current subscription tier.**

| Field | Value |
|-------|-------|
| Auth | Required |
| Tier gating | None |

#### Response `200`

```json
{
  "tier": "free",
  "stripeCustomerId": null,
  "features": {
    "dailyQuestion": true,
    "answerSubmission": true,
    "topMatchOnly": true,
    "allPerspectives": false,
    "archive": false,
    "fullFingerprint": false,
    "detailedBreakdown": false
  }
}
```

For paid:

```json
{
  "tier": "paid",
  "stripeCustomerId": "cus_xxx",
  "features": {
    "dailyQuestion": true,
    "answerSubmission": true,
    "topMatchOnly": true,
    "allPerspectives": true,
    "archive": true,
    "fullFingerprint": true,
    "detailedBreakdown": true
  }
}
```

---

### 5.10 `PATCH /api/hard-question/subscription`

**Update subscription tier (MVP: manual toggle; Stripe webhook will replace this).**

| Field | Value |
|-------|-------|
| Auth | Required (admin or self) |
| Tier gating | N/A |

#### Request

```json
{
  "tier": "paid"
}
```

#### Response `200`

```json
{ "ok": true, "tier": "paid" }
```

#### Validation

- `tier` must be `"free"` or `"paid"`
- For MVP: any authenticated user can toggle their own tier (honor system / testing)
- For production: this endpoint gets locked down; only Stripe webhooks set the tier

---

### 5.11 `POST /api/hard-question/admin/seed`

**Bulk-import questions with philosopher perspectives. Pre-computes all perspective embeddings.**

| Field | Value |
|-------|-------|
| Auth | Required (admin only — checked via `ADMIN_USER_IDS` env var) |
| Tier gating | N/A |

#### Request

```json
{
  "questions": [
    {
      "scheduledDate": "2026-02-17",
      "questionText": "Is it ever ethical to lie?",
      "context": "Consider white lies, lies of omission, and noble lies...",
      "category": "Ethics",
      "perspectives": [
        {
          "philosopherName": "Aristotle",
          "school": "Virtue Ethics",
          "perspectiveText": "Aristotle would argue that the virtuous person knows when honesty serves the greater good of character development. The key question is not whether lying is permitted, but what a person of excellent character would do in this situation..."
        },
        {
          "philosopherName": "Immanuel Kant",
          "school": "Deontology",
          "perspectiveText": "Kant would insist that lying is always morally wrong, regardless of consequences. The categorical imperative demands that we act only according to maxims we could will to be universal laws..."
        },
        {
          "philosopherName": "John Stuart Mill",
          "school": "Utilitarianism",
          "perspectiveText": "Mill would evaluate lying purely by its consequences. If a lie produces more happiness and less suffering than the truth, it is the morally correct choice..."
        },
        {
          "philosopherName": "Simone de Beauvoir",
          "school": "Existentialism",
          "perspectiveText": "De Beauvoir would emphasize that the ethical weight of a lie depends on whether it expands or constrains the freedom of others..."
        },
        {
          "philosopherName": "Marcus Aurelius",
          "school": "Stoicism",
          "perspectiveText": "Marcus Aurelius would counsel that truthfulness is aligned with nature and reason. The Stoic path requires honest engagement with reality..."
        }
      ]
    }
  ]
}
```

#### Response `201`

```json
{
  "inserted": {
    "questions": 1,
    "perspectives": 5,
    "embeddingsComputed": 5
  },
  "errors": []
}
```

#### Response `207` (Partial Success)

```json
{
  "inserted": {
    "questions": 3,
    "perspectives": 12,
    "embeddingsComputed": 12
  },
  "errors": [
    {
      "scheduledDate": "2026-02-20",
      "error": "Question already exists for this date"
    }
  ]
}
```

#### Embedding Pipeline (Seed)

```typescript
// 1. Collect all perspective texts across all questions
const allTexts = questions.flatMap(q =>
  q.perspectives.map(p => p.perspectiveText)
)

// 2. Batch compute embeddings (100 at a time)
const allEmbeddings = await getEmbeddings(allTexts)

// 3. Insert questions and perspectives with embeddings
let embIdx = 0
for (const q of questions) {
  const { data: question } = await admin
    .from('questions')
    .insert({
      scheduled_date: q.scheduledDate,
      question_text: q.questionText,
      context: q.context,
      category: q.category,
    })
    .select('id')
    .single()

  const perspectiveRows = q.perspectives.map(p => ({
    question_id: question.id,
    philosopher_name: p.philosopherName,
    school: p.school,
    perspective_text: p.perspectiveText,
    embedding: JSON.stringify(allEmbeddings[embIdx++]),
  }))

  await admin.from('perspectives').insert(perspectiveRows)
}
```

---

## 6. Error Handling Patterns

### Standard Error Response Shape

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "OPTIONAL_ERROR_CODE",
  "details": {}
}
```

### Error Codes

| HTTP Status | Code | When |
|-------------|------|------|
| 400 | `INVALID_INPUT` | Validation failures |
| 401 | `UNAUTHORIZED` | Missing/invalid auth token |
| 403 | `FORBIDDEN` | Admin-only route, or feature requires paid tier |
| 403 | `ANSWER_REQUIRED` | Trying to view perspectives without answering |
| 404 | `NOT_FOUND` | Question/resource doesn't exist |
| 409 | `DUPLICATE` | Already answered / already favorited |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 502 | `OPENAI_ERROR` | OpenAI API call failed |

### Route Handler Pattern

Every route handler follows this structure:

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireUser } from '../_lib/auth'
import { serverError } from '../_lib/errors'

export async function GET(req: Request) {
  try {
    // 1. Auth
    const auth = await requireUser(req)
    if ('error' in auth) return auth.error

    // 2. Parse input / validate
    // 3. Business logic
    // 4. Return response

    return NextResponse.json({ ... })
  } catch (e) {
    console.error('[route-name]', e)
    return serverError()
  }
}
```

### OpenAI Error Handling

```typescript
try {
  const embedding = await getEmbedding(text)
} catch (e) {
  console.error('[answer] OpenAI embedding failed:', e)
  return NextResponse.json(
    { error: 'Failed to process your answer. Please try again.', code: 'OPENAI_ERROR' },
    { status: 502 }
  )
}
```

---

## 7. Rate Limiting

### Strategy: Two Layers

#### Layer 1: General API Rate Limit (In-Memory)

Uses the existing `src/lib/rate-limit/simple.ts` pattern:

```typescript
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
const rl = rateLimit(`hq:${ip}`, { limit: 60, windowMs: 60_000 })
if (!rl.ok) {
  return NextResponse.json(
    { error: 'Too many requests', resetAt: rl.resetAt },
    { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
  )
}
```

Default: **60 requests per minute per IP** across all Hard Question endpoints.

#### Layer 2: Answer Submission (Database Constraint)

The `answers_one_per_user_per_question` unique constraint enforces max 1 answer per question per user at the database level. The route handler also checks proactively:

```typescript
// Pre-check (fast fail before calling OpenAI)
const { data: existing } = await admin
  .from('answers')
  .select('id')
  .eq('user_id', user.id)
  .eq('question_id', questionId)
  .maybeSingle()

if (existing) {
  return conflict('You have already answered this question')
}
```

This is critical because we don't want to waste an OpenAI API call if the user already answered.

#### Layer 3 (Future): Per-User Rate Limit with Upstash Redis

For production with Vercel serverless (no shared memory), replace the in-memory limiter:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'),
})
```

---

## 8. RLS Policies

### Enable RLS on All Tables

```sql
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.perspectives enable row level security;
alter table public.answers enable row level security;
alter table public.similarity_scores enable row level security;
alter table public.favorites enable row level security;
```

### Policies

Since all API routes use `supabaseAdmin()` (service role key, bypasses RLS), these policies protect against direct Supabase client access:

```sql
-- Profiles: users can read/update their own
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Questions: readable by all authenticated users
create policy "questions_select_authenticated" on public.questions
  for select using (auth.uid() is not null);

-- Perspectives: readable by all authenticated users
-- (tier gating happens in the route handler, not RLS)
create policy "perspectives_select_authenticated" on public.perspectives
  for select using (auth.uid() is not null);

-- Answers: users can read/insert their own
create policy "answers_select_own" on public.answers
  for select using (auth.uid() = user_id);
create policy "answers_insert_own" on public.answers
  for insert with check (auth.uid() = user_id);

-- Similarity scores: users can read their own
create policy "similarity_scores_select_own" on public.similarity_scores
  for select using (auth.uid() = user_id);

-- Favorites: users can read/insert/delete their own
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);
```

---

## 9. Environment Variables

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# New for Hard Question
OPENAI_API_KEY=sk-...
ADMIN_USER_IDS=uuid1,uuid2   # comma-separated Supabase auth user IDs
```

---

## 10. API Route Summary Table

| Route | Method | Auth | Tier Gate | Description |
|-------|--------|------|-----------|-------------|
| `/api/hard-question/question` | GET | ✅ | None | Today's question |
| `/api/hard-question/question/[date]` | GET | ✅ | Paid | Question by date |
| `/api/hard-question/answer` | POST | ✅ | None | Submit answer + compute similarities |
| `/api/hard-question/perspectives/[questionId]` | GET | ✅ | Partial | Top match (free) or all (paid) |
| `/api/hard-question/fingerprint` | GET | ✅ | Partial | Top 3 schools (free) or all (paid) |
| `/api/hard-question/archive` | GET | ✅ | Paid | Browse past questions |
| `/api/hard-question/favorites` | GET | ✅ | None | List favorites |
| `/api/hard-question/favorites` | POST | ✅ | None | Add favorite |
| `/api/hard-question/favorites` | DELETE | ✅ | None | Remove favorite |
| `/api/hard-question/subscription` | GET | ✅ | None | Check tier |
| `/api/hard-question/subscription` | PATCH | ✅ | None | Update tier (MVP) |
| `/api/hard-question/admin/seed` | POST | ✅ Admin | None | Bulk import questions |

---

## 11. Client Integration Notes

### Auth Header Pattern

All requests from the client include the Supabase access token:

```typescript
const { session } = useAuth()

const res = await fetch('/api/hard-question/question', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
})
```

### Tier-Gated UI Pattern

The API always returns the `tier` field and uses `null` for gated content. The client renders accordingly:

```tsx
// Client knows what to blur/lock based on null values
{perspectives.otherMatches.map(m =>
  m.score === null ? (
    <LockedPerspectiveCard
      philosopherName={m.philosopherName}
      school={m.school}
      onUpgrade={() => router.push('/upgrade')}
    />
  ) : (
    <PerspectiveCard {...m} />
  )
)}
```

### Optimistic Answer Flow

```
1. User types answer → POST /api/hard-question/answer
2. Show loading spinner (embedding computation takes ~500ms)
3. On 201: animate reveal of top match
4. If paid: show all matches with staggered animation
5. If free: show locked cards with upgrade CTA
```