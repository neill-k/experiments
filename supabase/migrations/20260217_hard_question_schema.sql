-- ============================================================
-- "The Hard Question" — Daily Philosophy App Schema
-- Migration: 20260217_hard_question_schema.sql
--
-- Depends on: auth.users (Supabase Auth, GitHub provider)
-- Adds: pgvector, enums, 7 new tables, RLS policies, indexes
-- ============================================================

begin;

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

-- pgvector for embedding similarity search
create extension if not exists vector with schema extensions;

-- ============================================================
-- 1. CUSTOM TYPES (ENUMS)
-- ============================================================

-- Subscription tiers
do $$ begin
  create type public.subscription_tier as enum ('free', 'paid');
exception when duplicate_object then null; end $$;

-- Philosophy schools (extensible — add new values with ALTER TYPE)
do $$ begin
  create type public.philosophy_school as enum (
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
    'ubuntu'
  );
exception when duplicate_object then null; end $$;

-- Difficulty levels
do $$ begin
  create type public.question_difficulty as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. USER PROFILES
-- ============================================================
-- Extends auth.users with app-specific fields.
-- Created automatically via trigger on auth.users insert.

create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  tier          public.subscription_tier not null default 'free',
  -- Stripe/payment integration hook
  stripe_customer_id  text unique,
  -- Tracks how many questions answered (denormalized for quick checks)
  questions_answered  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.user_profiles is
  'App-specific profile extending Supabase auth.users. One row per user.';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop if exists to make migration re-runnable
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. DAILY QUESTIONS
-- ============================================================

create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  -- The question text itself
  question_text   text not null,
  -- Short context/background for the question
  context         text,
  -- Categorization
  category        text not null,          -- e.g. 'ethics', 'epistemology', 'metaphysics', 'politics', 'aesthetics'
  difficulty      public.question_difficulty not null default 'intermediate',
  -- Daily rotation: exactly one question per date
  published_date  date unique,            -- NULL = drafted but not yet scheduled
  -- Metadata
  source          text,                   -- attribution if adapted from a text
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.questions is
  'Daily philosophy questions. One published per day via published_date.';
comment on column public.questions.published_date is
  'The date this question goes live. NULL means drafted/unscheduled. UNIQUE ensures one per day.';

-- ============================================================
-- 4. PHILOSOPHER PERSPECTIVES
-- ============================================================
-- Pre-computed responses from a philosopher's viewpoint.
-- 3-5 per question, each with a pre-computed embedding.

create table if not exists public.philosopher_perspectives (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references public.questions(id) on delete cascade,
  -- The philosopher
  philosopher_name text not null,          -- e.g. 'Marcus Aurelius', 'Simone de Beauvoir'
  school          public.philosophy_school not null,
  -- The perspective content
  perspective_text text not null,          -- The philosopher's "answer"
  summary         text,                   -- One-line summary for card display
  -- Pre-computed embedding (text-embedding-3-small = 1536 dims)
  embedding       extensions.vector(1536),
  -- Metadata
  sort_order      smallint not null default 0,  -- display ordering within a question
  created_at      timestamptz not null default now()
);

comment on table public.philosopher_perspectives is
  'Pre-computed philosopher perspectives per question, with embeddings for similarity matching.';

-- Ensure no duplicate philosopher per question
create unique index if not exists perspectives_question_philosopher_uniq
  on public.philosopher_perspectives (question_id, philosopher_name);

-- ============================================================
-- 5. USER ANSWERS
-- ============================================================
-- A user's response to a daily question. One answer per user per question.

create table if not exists public.user_answers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  question_id     uuid not null references public.questions(id) on delete cascade,
  -- The answer
  answer_text     text not null,
  -- Computed embedding (generated server-side after submission)
  embedding       extensions.vector(1536),
  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.user_answers is
  'User responses to daily questions, with computed embeddings for similarity matching.';

-- One answer per user per question
create unique index if not exists answers_user_question_uniq
  on public.user_answers (user_id, question_id);

-- ============================================================
-- 6. SIMILARITY SCORES
-- ============================================================
-- Pre-computed cosine similarity between a user's answer and each
-- philosopher perspective for a given question.

create table if not exists public.similarity_scores (
  id              uuid primary key default gen_random_uuid(),
  user_answer_id  uuid not null references public.user_answers(id) on delete cascade,
  perspective_id  uuid not null references public.philosopher_perspectives(id) on delete cascade,
  -- Cosine similarity score: -1.0 to 1.0
  score           double precision not null,
  -- Which school this perspective belongs to (denormalized for fast aggregation)
  school          public.philosophy_school not null,
  created_at      timestamptz not null default now()
);

comment on table public.similarity_scores is
  'Cosine similarity between user answers and philosopher perspectives. Computed server-side.';

-- One score per answer-perspective pair
create unique index if not exists scores_answer_perspective_uniq
  on public.similarity_scores (user_answer_id, perspective_id);

-- Fast lookup: all scores for a given answer
create index if not exists scores_user_answer_idx
  on public.similarity_scores (user_answer_id);

-- ============================================================
-- 7. PHILOSOPHICAL FINGERPRINTS
-- ============================================================
-- Aggregated alignment scores per philosophy school over time.
-- Updated after each answer. One row per user per school.

create table if not exists public.philosophical_fingerprints (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  school          public.philosophy_school not null,
  -- Running average similarity to this school
  avg_score       double precision not null default 0.0,
  -- Number of data points (for incremental average calculation)
  sample_count    integer not null default 0,
  -- Min/max for range display
  min_score       double precision,
  max_score       double precision,
  -- Trend: recent 7-day average vs all-time
  recent_avg      double precision,
  updated_at      timestamptz not null default now()
);

comment on table public.philosophical_fingerprints is
  'Aggregated alignment scores per user per philosophy school. The user''s philosophical DNA.';

-- One row per user per school
create unique index if not exists fingerprints_user_school_uniq
  on public.philosophical_fingerprints (user_id, school);

-- ============================================================
-- 8. USER FAVORITES (BOOKMARKS)
-- ============================================================

create table if not exists public.user_favorites (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  question_id     uuid not null references public.questions(id) on delete cascade,
  created_at      timestamptz not null default now()
);

comment on table public.user_favorites is
  'User-bookmarked questions for later reference.';

-- One favorite per user per question
create unique index if not exists favorites_user_question_uniq
  on public.user_favorites (user_id, question_id);

-- ============================================================
-- 9. SUBSCRIPTION EVENTS (AUDIT LOG)
-- ============================================================
-- Tracks tier changes for billing reconciliation.

create table if not exists public.subscription_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  previous_tier   public.subscription_tier,
  new_tier        public.subscription_tier not null,
  -- Stripe webhook event ID for idempotency
  stripe_event_id text unique,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now()
);

comment on table public.subscription_events is
  'Audit log of subscription tier changes, linked to Stripe webhook events.';

create index if not exists subscription_events_user_idx
  on public.subscription_events (user_id);

-- ============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================

-- Questions: fast lookup by published date (daily rotation query)
create index if not exists questions_published_date_idx
  on public.questions (published_date)
  where published_date is not null;

-- Questions: category filtering
create index if not exists questions_category_idx
  on public.questions (category);

-- Perspectives: fast lookup by question
create index if not exists perspectives_question_idx
  on public.philosopher_perspectives (question_id);

-- Perspectives: filter by school
create index if not exists perspectives_school_idx
  on public.philosopher_perspectives (school);

-- Answers: user's answer history
create index if not exists answers_user_idx
  on public.user_answers (user_id);

-- Answers: all answers for a question
create index if not exists answers_question_idx
  on public.user_answers (question_id);

-- Favorites: user's bookmarks list
create index if not exists favorites_user_idx
  on public.user_favorites (user_id);

-- Fingerprints: user lookup
create index if not exists fingerprints_user_idx
  on public.philosophical_fingerprints (user_id);

-- ============================================================
-- 11. VECTOR INDEXES (pgvector IVFFlat for similarity search)
-- ============================================================
-- IVFFlat indexes for cosine similarity searches.
-- `lists` parameter: rule of thumb is sqrt(n_rows). Start with 10,
-- increase as data grows. Rebuild with REINDEX when data 10x's.

-- Perspective embeddings: "which perspectives are most similar to X?"
create index if not exists perspectives_embedding_idx
  on public.philosopher_perspectives
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 10);

-- User answer embeddings: "which other users answered similarly?"
create index if not exists answers_embedding_idx
  on public.user_answers
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 10);

-- ============================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================

-- ---------- user_profiles ----------
alter table public.user_profiles enable row level security;

-- Users can read their own profile
do $$ begin
  create policy "profiles_select_own" on public.user_profiles
    for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Users can update their own profile (display_name, avatar)
-- tier changes go through service role (Stripe webhooks)
do $$ begin
  create policy "profiles_update_own" on public.user_profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- ---------- questions ----------
alter table public.questions enable row level security;

-- Everyone can read published questions
do $$ begin
  create policy "questions_select_published" on public.questions
    for select using (published_date is not null and published_date <= current_date);
exception when duplicate_object then null; end $$;

-- No client-side insert/update/delete (admin via service role)

-- ---------- philosopher_perspectives ----------
alter table public.philosopher_perspectives enable row level security;

-- Everyone can read perspectives for published questions
do $$ begin
  create policy "perspectives_select_published" on public.philosopher_perspectives
    for select using (
      exists (
        select 1 from public.questions q
        where q.id = question_id
          and q.published_date is not null
          and q.published_date <= current_date
      )
    );
exception when duplicate_object then null; end $$;

-- No client-side insert/update/delete

-- ---------- user_answers ----------
alter table public.user_answers enable row level security;

-- Users can read only their own answers
do $$ begin
  create policy "answers_select_own" on public.user_answers
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Users can insert their own answers
do $$ begin
  create policy "answers_insert_own" on public.user_answers
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Users can update their own answers (re-submit)
do $$ begin
  create policy "answers_update_own" on public.user_answers
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ---------- similarity_scores ----------
alter table public.similarity_scores enable row level security;

-- Users can read scores for their own answers
do $$ begin
  create policy "scores_select_own" on public.similarity_scores
    for select using (
      exists (
        select 1 from public.user_answers ua
        where ua.id = user_answer_id
          and ua.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- No client-side insert/update/delete (computed server-side)

-- ---------- philosophical_fingerprints ----------
alter table public.philosophical_fingerprints enable row level security;

-- Users can read only their own fingerprints
do $$ begin
  create policy "fingerprints_select_own" on public.philosophical_fingerprints
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- No client-side insert/update/delete (computed server-side)

-- ---------- user_favorites ----------
alter table public.user_favorites enable row level security;

-- Users can read their own favorites
do $$ begin
  create policy "favorites_select_own" on public.user_favorites
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Users can insert their own favorites
do $$ begin
  create policy "favorites_insert_own" on public.user_favorites
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Users can delete their own favorites (unbookmark)
do $$ begin
  create policy "favorites_delete_own" on public.user_favorites
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ---------- subscription_events ----------
alter table public.subscription_events enable row level security;

-- Users can read their own subscription history
do $$ begin
  create policy "sub_events_select_own" on public.subscription_events
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- No client-side insert (Stripe webhooks via service role)

-- ============================================================
-- 13. HELPER FUNCTIONS
-- ============================================================

-- Get today's question
create or replace function public.get_todays_question()
returns setof public.questions
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.questions
  where published_date = current_date
  limit 1;
$$;

-- Compute cosine similarity between a user answer and all perspectives
-- for a given question. Called server-side after embedding is computed.
create or replace function public.match_perspectives(
  p_answer_embedding extensions.vector(1536),
  p_question_id uuid,
  p_match_count integer default 5
)
returns table (
  perspective_id uuid,
  philosopher_name text,
  school public.philosophy_school,
  perspective_text text,
  summary text,
  similarity double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pp.id as perspective_id,
    pp.philosopher_name,
    pp.school,
    pp.perspective_text,
    pp.summary,
    1 - (pp.embedding <=> p_answer_embedding) as similarity
  from public.philosopher_perspectives pp
  where pp.question_id = p_question_id
    and pp.embedding is not null
  order by pp.embedding <=> p_answer_embedding
  limit p_match_count;
$$;

-- Update a user's philosophical fingerprint after a new score
-- Uses incremental average: new_avg = old_avg + (new_val - old_avg) / new_count
create or replace function public.update_fingerprint(
  p_user_id uuid,
  p_school public.philosophy_school,
  p_new_score double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.philosophical_fingerprints (user_id, school, avg_score, sample_count, min_score, max_score, updated_at)
  values (p_user_id, p_school, p_new_score, 1, p_new_score, p_new_score, now())
  on conflict (user_id, school) do update set
    avg_score = public.philosophical_fingerprints.avg_score +
      (p_new_score - public.philosophical_fingerprints.avg_score) /
      (public.philosophical_fingerprints.sample_count + 1),
    sample_count = public.philosophical_fingerprints.sample_count + 1,
    min_score = least(public.philosophical_fingerprints.min_score, p_new_score),
    max_score = greatest(public.philosophical_fingerprints.max_score, p_new_score),
    updated_at = now();
end;
$$;

-- Check if a free-tier user has already answered today
create or replace function public.has_answered_today(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_answers ua
    join public.questions q on q.id = ua.question_id
    where ua.user_id = p_user_id
      and q.published_date = current_date
  );
$$;

-- ============================================================
-- 14. UPDATED_AT TRIGGER (shared)
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to tables with updated_at
do $$ begin
  create trigger set_updated_at before update on public.user_profiles
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_updated_at before update on public.questions
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_updated_at before update on public.user_answers
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- 15. SEED DATA PATTERNS (examples, not real content)
-- ============================================================

-- NOTE: These are INSERT patterns showing the expected shape.
-- Actual content seeding happens via a separate seed file or admin API.

/*
-- Insert a question
INSERT INTO public.questions (question_text, context, category, difficulty, published_date)
VALUES (
  'Is it possible to act selflessly, or is all altruism ultimately self-serving?',
  'This question explores the tension between psychological egoism and genuine altruism...',
  'ethics',
  'intermediate',
  '2026-02-17'
);

-- Insert philosopher perspectives (with embeddings computed externally)
INSERT INTO public.philosopher_perspectives
  (question_id, philosopher_name, school, perspective_text, summary, embedding, sort_order)
VALUES
  (
    '{{question_uuid}}',
    'Marcus Aurelius',
    'stoicism',
    'The Stoic does not ask whether an act is selfish or selfless...',
    'Virtue is its own reward — the question of selfishness dissolves.',
    '[0.012, -0.034, ...]'::vector(1536),  -- actual 1536-dim vector
    1
  ),
  (
    '{{question_uuid}}',
    'Simone de Beauvoir',
    'existentialism',
    'Freedom is always situated. To act for another is to affirm...',
    'True freedom requires engagement with others'' freedom.',
    '[0.045, 0.012, ...]'::vector(1536),
    2
  ),
  (
    '{{question_uuid}}',
    'Peter Singer',
    'utilitarianism',
    'The motivation matters less than the outcome...',
    'Effective altruism: maximize well-being regardless of motive.',
    '[-0.023, 0.067, ...]'::vector(1536),
    3
  );

-- Insert a user answer (embedding computed server-side after insert)
INSERT INTO public.user_answers (user_id, question_id, answer_text)
VALUES ('{{user_uuid}}', '{{question_uuid}}', 'I think true selflessness is possible...');

-- Update with embedding once computed
UPDATE public.user_answers
SET embedding = '[0.033, -0.012, ...]'::vector(1536)
WHERE id = '{{answer_uuid}}';

-- Record similarity scores
INSERT INTO public.similarity_scores (user_answer_id, perspective_id, score, school)
VALUES
  ('{{answer_uuid}}', '{{perspective_1_uuid}}', 0.87, 'stoicism'),
  ('{{answer_uuid}}', '{{perspective_2_uuid}}', 0.72, 'existentialism'),
  ('{{answer_uuid}}', '{{perspective_3_uuid}}', 0.65, 'utilitarianism');

-- Update fingerprints (via function)
SELECT public.update_fingerprint('{{user_uuid}}', 'stoicism', 0.87);
SELECT public.update_fingerprint('{{user_uuid}}', 'existentialism', 0.72);
SELECT public.update_fingerprint('{{user_uuid}}', 'utilitarianism', 0.65);

-- Bookmark a question
INSERT INTO public.user_favorites (user_id, question_id)
VALUES ('{{user_uuid}}', '{{question_uuid}}');

-- Record a subscription change
INSERT INTO public.subscription_events (user_id, previous_tier, new_tier, stripe_event_id)
VALUES ('{{user_uuid}}', 'free', 'paid', 'evt_1234567890');

UPDATE public.user_profiles SET tier = 'paid' WHERE id = '{{user_uuid}}';
*/

commit;
