# The Wrong Answer - Backend Architecture

> A quiz game where wrong answers are scored by AI. The more creative, convincing, and hilarious your wrong answer, the higher you score.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Row-Level Security (RLS)](#row-level-security)
4. [API Routes](#api-routes)
5. [AI Scoring Pipeline](#ai-scoring-pipeline)
6. [Expert Mode - "Fool the AI"](#expert-mode)
7. [Auth Strategy](#auth-strategy)
8. [Question Seeding](#question-seeding)
9. [Rate Limiting & Cost Estimation](#rate-limiting--cost-estimation)
10. [Caching Strategy](#caching-strategy)
11. [Deployment Notes](#deployment-notes)

---

## Overview

### Tech Stack
- **Framework:** Next.js App Router (app/) with TypeScript
- **Database:** Supabase (Postgres) - project `aigtysjmujdatykdnjdn`
- **Auth:** Supabase Auth with GitHub OAuth + anonymous fingerprint play
- **AI Scoring:** Anthropic Claude (claude-sonnet-4-20250514) via API
- **Hosting:** Vercel
- **Existing patterns:** follows `experiments/` project conventions (see `/src/lib/supabase/`)

### Architecture Diagram

```
Browser (Next.js client)
  |
  ├── GET /api/wrong-answer/question     -> Supabase (questions table)
  ├── POST /api/wrong-answer/answer      -> AI Scoring -> Supabase (answers table)
  ├── GET /api/wrong-answer/leaderboard  -> Supabase (leaderboard view)
  └── GET /api/wrong-answer/answer/[id]  -> Supabase (answers table)
```

---

## Database Schema

### Migration file: `supabase/migrations/YYYYMMDD_wrong_answer_schema.sql`

```sql
-- ============================================================
-- The Wrong Answer - Database Schema
-- ============================================================

-- 1. QUESTIONS TABLE
-- Stores the quiz questions with their correct answers
create table if not exists wrong_answer_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null check (category in (
    'Science', 'History', 'Math', 'Geography',
    'Pop Culture', 'Language', 'Nature'
  )),
  correct_answer text not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  -- 1 = Easy (common knowledge), 2 = Medium, 3 = Hard (obscure)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_waq_category on wrong_answer_questions(category);
create index idx_waq_active on wrong_answer_questions(active) where active = true;
create index idx_waq_difficulty on wrong_answer_questions(difficulty);

-- 2. ANSWERS TABLE
-- Stores every submitted answer with AI-generated scores
create table if not exists wrong_answer_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references wrong_answer_questions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  -- null for anonymous players
  fingerprint text,
  -- browser fingerprint for anonymous tracking
  answer_text text not null,
  scores jsonb not null default '{}'::jsonb,
  -- Structure: {
  --   "creativity": 0-100,    -- How original and unexpected
  --   "comedy": 0-100,        -- How funny
  --   "conviction": 0-100,    -- How confidently wrong
  --   "plausibility": 0-100,  -- How almost-right it sounds
  --   "consistency": 0-100    -- Internal logic of the wrong answer
  -- }
  total_score smallint not null default 0,
  -- Sum of all dimensions (0-500)
  judge_commentary text,
  -- Witty AI judge response
  is_expert_mode boolean not null default false,
  -- True if submitted in "fool the AI" mode
  expert_fooled boolean,
  -- null if not expert mode; true/false if AI was fooled
  created_at timestamptz not null default now()
);

create index idx_waa_question on wrong_answer_answers(question_id);
create index idx_waa_user on wrong_answer_answers(user_id) where user_id is not null;
create index idx_waa_fingerprint on wrong_answer_answers(fingerprint) where fingerprint is not null;
create index idx_waa_total_score on wrong_answer_answers(total_score desc);
create index idx_waa_created on wrong_answer_answers(created_at desc);
create index idx_waa_daily on wrong_answer_answers(created_at desc, total_score desc);

-- 3. DAILY CHALLENGES TABLE
-- One question per day, pre-selected or auto-assigned
create table if not exists wrong_answer_daily_challenges (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references wrong_answer_questions(id) on delete cascade,
  challenge_date date not null unique,
  created_at timestamptz not null default now()
);

create unique index idx_wadc_date on wrong_answer_daily_challenges(challenge_date);

-- 4. LEADERBOARD VIEW
-- Daily leaderboard (today's challenge answers)
create or replace view wrong_answer_daily_leaderboard as
select
  a.id as answer_id,
  a.question_id,
  a.user_id,
  a.fingerprint,
  a.answer_text,
  a.scores,
  a.total_score,
  a.judge_commentary,
  a.is_expert_mode,
  a.expert_fooled,
  a.created_at,
  coalesce(
    (select raw_user_meta_data->>'user_name' from auth.users where id = a.user_id),
    'Anonymous'
  ) as display_name,
  coalesce(
    (select raw_user_meta_data->>'avatar_url' from auth.users where id = a.user_id),
    null
  ) as avatar_url
from wrong_answer_answers a
join wrong_answer_daily_challenges dc
  on dc.question_id = a.question_id
  and dc.challenge_date = current_date
order by a.total_score desc, a.created_at asc;

-- All-time leaderboard (best single-answer scores ever)
create or replace view wrong_answer_alltime_leaderboard as
select
  a.id as answer_id,
  a.question_id,
  q.text as question_text,
  a.user_id,
  a.answer_text,
  a.scores,
  a.total_score,
  a.judge_commentary,
  a.is_expert_mode,
  a.expert_fooled,
  a.created_at,
  coalesce(
    (select raw_user_meta_data->>'user_name' from auth.users where id = a.user_id),
    'Anonymous'
  ) as display_name,
  coalesce(
    (select raw_user_meta_data->>'avatar_url' from auth.users where id = a.user_id),
    null
  ) as avatar_url
from wrong_answer_answers a
join wrong_answer_questions q on q.id = a.question_id
order by a.total_score desc, a.created_at asc;

-- 5. HELPER FUNCTIONS

-- Get today's daily challenge question (creates one if missing)
create or replace function get_or_create_daily_challenge()
returns uuid
language plpgsql
security definer
as $$
declare
  v_question_id uuid;
begin
  -- Try to get existing challenge
  select question_id into v_question_id
  from wrong_answer_daily_challenges
  where challenge_date = current_date;

  if v_question_id is not null then
    return v_question_id;
  end if;

  -- Pick a random active question not used in the last 30 days
  select q.id into v_question_id
  from wrong_answer_questions q
  where q.active = true
    and q.id not in (
      select dc.question_id
      from wrong_answer_daily_challenges dc
      where dc.challenge_date > current_date - interval '30 days'
    )
  order by random()
  limit 1;

  -- Fallback: any active question
  if v_question_id is null then
    select id into v_question_id
    from wrong_answer_questions
    where active = true
    order by random()
    limit 1;
  end if;

  if v_question_id is null then
    raise exception 'No active questions available';
  end if;

  -- Insert the daily challenge
  insert into wrong_answer_daily_challenges (question_id, challenge_date)
  values (v_question_id, current_date)
  on conflict (challenge_date) do nothing;

  return v_question_id;
end;
$$;

-- Migrate anonymous answers to authenticated user
create or replace function migrate_anonymous_answers(
  p_fingerprint text,
  p_user_id uuid
)
returns integer
language plpgsql
security definer
as $$
declare
  v_migrated integer;
begin
  update wrong_answer_answers
  set user_id = p_user_id
  where fingerprint = p_fingerprint
    and user_id is null
    -- Don't overwrite if user already answered that question
    and question_id not in (
      select question_id
      from wrong_answer_answers
      where user_id = p_user_id
    );

  get diagnostics v_migrated = row_count;
  return v_migrated;
end;
$$;
```

### TypeScript Types

```typescript
// src/app/e/wrong-answer/types.ts

export type Category =
  | 'Science'
  | 'History'
  | 'Math'
  | 'Geography'
  | 'Pop Culture'
  | 'Language'
  | 'Nature'

export type Difficulty = 1 | 2 | 3

export interface Question {
  id: string
  text: string
  category: Category
  correct_answer: string
  difficulty: Difficulty
  created_at: string
}

/** Individual scoring dimensions (0-100 each) */
export interface ScoreDimensions {
  creativity: number
  comedy: number
  conviction: number
  plausibility: number
  consistency: number
}

export interface Answer {
  id: string
  question_id: string
  user_id: string | null
  fingerprint: string | null
  answer_text: string
  scores: ScoreDimensions
  total_score: number
  judge_commentary: string | null
  is_expert_mode: boolean
  expert_fooled: boolean | null
  created_at: string
}

export interface LeaderboardEntry {
  answer_id: string
  question_id: string
  question_text?: string
  user_id: string | null
  answer_text: string
  scores: ScoreDimensions
  total_score: number
  judge_commentary: string | null
  is_expert_mode: boolean
  expert_fooled: boolean | null
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface DailyChallenge {
  id: string
  question_id: string
  challenge_date: string
  question?: Question
}

/** API response from POST /api/wrong-answer/answer */
export interface AnswerResponse {
  answer_id: string | null
  scores: ScoreDimensions
  total_score: number
  judge_commentary: string
  expert_fooled?: boolean
  saved: boolean
}
```

---

## Row-Level Security

```sql
-- ============================================================
-- RLS Policies for The Wrong Answer
-- ============================================================

-- QUESTIONS: anyone can read active questions
alter table wrong_answer_questions enable row level security;

create policy "Anyone can read active questions"
  on wrong_answer_questions for select
  using (active = true);

-- No insert/update/delete via client - admin only (service role)

-- ANSWERS: insert open (with rate limiting at API layer), select restricted
alter table wrong_answer_answers enable row level security;

-- Anyone can insert (anonymous or authenticated)
create policy "Anyone can insert answers"
  on wrong_answer_answers for insert
  with check (true);

-- Users can read their own answers (by user_id or fingerprint)
create policy "Users can read own answers by user_id"
  on wrong_answer_answers for select
  using (user_id = auth.uid());

create policy "Anyone can read answers by id for sharing"
  on wrong_answer_answers for select
  using (true);
  -- Note: the API route handler controls what fields are exposed.
  -- We allow select so shared answer links work.
  -- If you want to hide answer_text from non-owners, move to
  -- service-role-only reads and expose via API.

-- DAILY CHALLENGES: anyone can read
alter table wrong_answer_daily_challenges enable row level security;

create policy "Anyone can read daily challenges"
  on wrong_answer_daily_challenges for select
  using (true);
```

> **Design note:** Rate limiting, spam prevention, and field-level filtering are enforced at the API route layer (not RLS), since anonymous users don't have Supabase auth tokens. All writes from the client go through Next.js API routes using the service role key.

---

## API Routes

All routes live under `src/app/api/wrong-answer/`.

### 1. `GET /api/wrong-answer/question`

**Purpose:** Get a question to answer (daily challenge or random).

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `"daily"` \| `"random"` \| `"category"` | `"daily"` | Which question to fetch |
| `category` | Category string | - | Required if mode=category |
| `difficulty` | `1` \| `2` \| `3` | - | Optional difficulty filter |

**Response (200):**
```json
{
  "question": {
    "id": "uuid",
    "text": "What is the chemical symbol for gold?",
    "category": "Science",
    "difficulty": 1
  },
  "is_daily_challenge": true,
  "challenge_date": "2026-02-18"
}
```

> **Note:** `correct_answer` is NEVER returned to the client. It's only used server-side for AI scoring.

**Implementation:**
```typescript
// src/app/api/wrong-answer/question/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') || 'daily'
  const category = searchParams.get('category')
  const difficulty = searchParams.get('difficulty')

  const admin = supabaseAdmin()

  if (mode === 'daily') {
    // Use the SQL function to get/create today's challenge
    const { data: questionId, error } = await admin.rpc('get_or_create_daily_challenge')

    if (error || !questionId) {
      return NextResponse.json({ error: 'No daily challenge available' }, { status: 500 })
    }

    const { data: question } = await admin
      .from('wrong_answer_questions')
      .select('id, text, category, difficulty')
      .eq('id', questionId)
      .single()

    return NextResponse.json({
      question,
      is_daily_challenge: true,
      challenge_date: new Date().toISOString().split('T')[0],
    })
  }

  // Random or category mode
  let query = admin
    .from('wrong_answer_questions')
    .select('id, text, category, difficulty')
    .eq('active', true)

  if (mode === 'category' && category) {
    query = query.eq('category', category)
  }
  if (difficulty) {
    query = query.eq('difficulty', parseInt(difficulty))
  }

  // Postgres random ordering
  const { data: questions, error } = await query.limit(50)

  if (error || !questions?.length) {
    return NextResponse.json({ error: 'No questions available' }, { status: 404 })
  }

  const question = questions[Math.floor(Math.random() * questions.length)]

  return NextResponse.json({
    question: {
      id: question.id,
      text: question.text,
      category: question.category,
      difficulty: question.difficulty,
    },
    is_daily_challenge: false,
  })
}
```

---

### 2. `POST /api/wrong-answer/answer`

**Purpose:** Submit a wrong answer, trigger AI scoring, return results.

**Request body:**
```json
{
  "question_id": "uuid",
  "answer_text": "Aurum Deluxe 3000",
  "fingerprint": "abc123hash",
  "is_expert_mode": false
}
```

**Headers:**
- `Authorization: Bearer <supabase_access_token>` (optional, for authenticated users)

**Response (200):**
```json
{
  "answer_id": "uuid-or-null",
  "scores": {
    "creativity": 78,
    "comedy": 85,
    "conviction": 62,
    "plausibility": 45,
    "consistency": 71
  },
  "total_score": 341,
  "judge_commentary": "Ah yes, the Aurum Deluxe 3000 - the premium edition of gold that comes with a warranty card and cup holder. I admire the commitment to branding a chemical element. Points docked for not including a subscription model.",
  "expert_fooled": null,
  "saved": true
}
```

**Implementation:**
```typescript
// src/app/api/wrong-answer/answer/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'
import { scoreWrongAnswer, evaluateExpertMode } from '../../_lib/wrong-answer-scoring'

// Simple in-memory rate limiting (per fingerprint)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20 // answers per window
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth (optional)
    let userId: string | null = null
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const userClient = supabaseFromAccessToken(token)
      const { data: { user } } = await userClient.auth.getUser()
      if (user) userId = user.id
    }

    // 2. Parse body
    const body = await req.json()
    const { question_id, answer_text, fingerprint, is_expert_mode } = body

    if (!question_id || !answer_text?.trim()) {
      return NextResponse.json(
        { error: 'question_id and answer_text are required' },
        { status: 400 }
      )
    }

    // Sanitize answer length
    if (answer_text.length > 500) {
      return NextResponse.json(
        { error: 'Answer must be 500 characters or less' },
        { status: 400 }
      )
    }

    // 3. Rate limiting
    const rateLimitKey = userId || fingerprint || req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too many answers submitted. Try again later.' },
        { status: 429 }
      )
    }

    const admin = supabaseAdmin()

    // 4. Fetch the question (with correct_answer for AI scoring)
    const { data: question, error: qErr } = await admin
      .from('wrong_answer_questions')
      .select('id, text, correct_answer, category, difficulty')
      .eq('id', question_id)
      .single()

    if (qErr || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 5. Check duplicate (if authenticated)
    if (userId) {
      const { data: existing } = await admin
        .from('wrong_answer_answers')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', question_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'You have already answered this question' },
          { status: 409 }
        )
      }
    }

    // 6. AI Scoring
    let scores, judgeCommentary, expertFooled

    if (is_expert_mode) {
      // Expert mode: AI tries to determine if the answer is actually correct
      const expertResult = await evaluateExpertMode(
        question.text,
        question.correct_answer,
        answer_text
      )
      expertFooled = expertResult.fooled
      scores = expertResult.scores
      judgeCommentary = expertResult.commentary
    } else {
      // Normal mode: score the wrong answer
      const result = await scoreWrongAnswer(
        question.text,
        question.correct_answer,
        answer_text,
        question.category,
        question.difficulty
      )
      scores = result.scores
      judgeCommentary = result.commentary
      expertFooled = null
    }

    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0)

    // 7. Save to database
    const { data: answer, error: insertErr } = await admin
      .from('wrong_answer_answers')
      .insert({
        question_id,
        user_id: userId,
        fingerprint: fingerprint || null,
        answer_text: answer_text.trim(),
        scores,
        total_score: totalScore,
        judge_commentary: judgeCommentary,
        is_expert_mode: !!is_expert_mode,
        expert_fooled: expertFooled,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Error saving answer:', insertErr)
      // Still return scores even if save fails
      return NextResponse.json({
        answer_id: null,
        scores,
        total_score: totalScore,
        judge_commentary: judgeCommentary,
        expert_fooled: expertFooled,
        saved: false,
      })
    }

    return NextResponse.json({
      answer_id: answer.id,
      scores,
      total_score: totalScore,
      judge_commentary: judgeCommentary,
      expert_fooled: expertFooled,
      saved: true,
    })
  } catch (err) {
    console.error('Error in POST /api/wrong-answer/answer:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

### 3. `GET /api/wrong-answer/leaderboard`

**Purpose:** Fetch top scores (daily or all-time).

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `scope` | `"daily"` \| `"alltime"` | `"daily"` | Which leaderboard |
| `limit` | number | `25` | Max entries |
| `offset` | number | `0` | Pagination offset |

**Response (200):**
```json
{
  "entries": [
    {
      "answer_id": "uuid",
      "display_name": "octocat",
      "avatar_url": "https://...",
      "answer_text": "Aurum Deluxe 3000",
      "total_score": 341,
      "scores": { ... },
      "judge_commentary": "...",
      "is_expert_mode": false,
      "created_at": "2026-02-18T..."
    }
  ],
  "scope": "daily",
  "total_count": 142
}
```

**Implementation:**
```typescript
// src/app/api/wrong-answer/leaderboard/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || 'daily'
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const admin = supabaseAdmin()
  const view = scope === 'alltime'
    ? 'wrong_answer_alltime_leaderboard'
    : 'wrong_answer_daily_leaderboard'

  const { data: entries, error, count } = await admin
    .from(view)
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }

  return NextResponse.json({
    entries: entries || [],
    scope,
    total_count: count || 0,
  })
}
```

---

### 4. `GET /api/wrong-answer/answer/[id]`

**Purpose:** Get a specific answer by ID (for sharing).

**Response (200):**
```json
{
  "answer": {
    "id": "uuid",
    "question_text": "What is the chemical symbol for gold?",
    "category": "Science",
    "answer_text": "Aurum Deluxe 3000",
    "scores": { ... },
    "total_score": 341,
    "judge_commentary": "...",
    "display_name": "octocat",
    "avatar_url": "https://...",
    "is_expert_mode": false,
    "expert_fooled": null,
    "created_at": "2026-02-18T..."
  }
}
```

**Implementation:**
```typescript
// src/app/api/wrong-answer/answer/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = supabaseAdmin()

  const { data: answer, error } = await admin
    .from('wrong_answer_answers')
    .select(`
      id,
      answer_text,
      scores,
      total_score,
      judge_commentary,
      is_expert_mode,
      expert_fooled,
      created_at,
      user_id,
      question_id,
      wrong_answer_questions!inner (
        text,
        category
      )
    `)
    .eq('id', id)
    .single()

  if (error || !answer) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
  }

  // Get display name from auth.users if available
  let displayName = 'Anonymous'
  let avatarUrl: string | null = null
  if (answer.user_id) {
    const { data: user } = await admin.auth.admin.getUserById(answer.user_id)
    if (user?.user) {
      displayName = user.user.user_metadata?.user_name || 'Anonymous'
      avatarUrl = user.user.user_metadata?.avatar_url || null
    }
  }

  const question = answer.wrong_answer_questions as unknown as { text: string; category: string }

  return NextResponse.json({
    answer: {
      id: answer.id,
      question_text: question.text,
      category: question.category,
      answer_text: answer.answer_text,
      scores: answer.scores,
      total_score: answer.total_score,
      judge_commentary: answer.judge_commentary,
      display_name: displayName,
      avatar_url: avatarUrl,
      is_expert_mode: answer.is_expert_mode,
      expert_fooled: answer.expert_fooled,
      created_at: answer.created_at,
    },
  })
}
```

---

## AI Scoring Pipeline

### Scoring Module

```typescript
// src/app/api/_lib/wrong-answer-scoring.ts

import Anthropic from '@anthropic-ai/sdk'
import { ScoreDimensions } from '@/app/e/wrong-answer/types'

let anthropicClient: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return anthropicClient
}

// ── Normal Mode Scoring ──────────────────────────────────────

const SCORING_SYSTEM_PROMPT = `You are the Judge of Wrong Answers - a snarky, witty quiz show judge who evaluates intentionally wrong answers to trivia questions.

Your job is to score how GOOD a wrong answer is across 5 dimensions. The best wrong answers are creative, funny, delivered with confidence, internally consistent, and just plausible enough to make someone do a double-take.

You MUST respond with valid JSON only. No markdown, no code fences, no extra text.

Scoring dimensions (each 0-100):

1. **creativity** - How original and unexpected is this wrong answer? A boring wrong answer scores low. A wildly inventive one scores high.
   - 0-20: Generic/obvious wrong answer ("I don't know", random word)
   - 21-50: Somewhat creative but predictable
   - 51-80: Genuinely unexpected and clever
   - 81-100: Brilliantly original, never-heard-that-before territory

2. **comedy** - How funny is this answer? Would it make people laugh?
   - 0-20: Not funny at all
   - 21-50: Mildly amusing, a smirk at best
   - 51-80: Genuinely funny, would get laughs at a party
   - 81-100: Comedy gold, screenshot-worthy

3. **conviction** - How confidently wrong is this answer? Does it sound like the person truly believes it?
   - 0-20: Clearly joking or uncertain ("maybe it's...")
   - 21-50: Some effort to sound sure
   - 51-80: Delivered with authority and commitment
   - 81-100: Said with the unshakeable confidence of someone who would bet their house on it

4. **plausibility** - How close to sounding correct is this answer? Could it trick someone?
   - 0-20: Obviously, absurdly wrong (everyone would know)