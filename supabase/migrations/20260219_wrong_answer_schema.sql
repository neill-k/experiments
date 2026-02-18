-- The Wrong Answer - quiz game where wrong answers score points
-- Migration: create tables, indexes, and RLS policies

-- Questions bank
CREATE TABLE wrong_answer_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('science','history','geography','math','nature','language','pop_culture')),
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily challenge assignment
CREATE TABLE wrong_answer_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES wrong_answer_questions(id),
  challenge_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player answers with AI scores
CREATE TABLE wrong_answer_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES wrong_answer_questions(id),
  user_id UUID REFERENCES auth.users(id),
  fingerprint TEXT,
  answer_text TEXT NOT NULL,
  score_conviction INTEGER NOT NULL DEFAULT 0,
  score_consistency INTEGER NOT NULL DEFAULT 0,
  score_comedy INTEGER NOT NULL DEFAULT 0,
  score_creativity INTEGER NOT NULL DEFAULT 0,
  score_plausibility INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  judge_commentary TEXT,
  is_daily BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_daily_per_user UNIQUE NULLS NOT DISTINCT (question_id, user_id, is_daily)
);

-- Indexes
CREATE INDEX idx_wa_answers_daily ON wrong_answer_answers(question_id, is_daily, total_score DESC)
  WHERE is_daily = TRUE;
CREATE INDEX idx_wa_answers_user ON wrong_answer_answers(user_id, created_at DESC);
CREATE INDEX idx_wa_daily_date ON wrong_answer_daily(challenge_date);

-- RLS: Questions - anyone can read
ALTER TABLE wrong_answer_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read" ON wrong_answer_questions FOR SELECT USING (true);

-- RLS: Daily - anyone can read
ALTER TABLE wrong_answer_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_read" ON wrong_answer_daily FOR SELECT USING (true);

-- RLS: Answers - anyone can read (for leaderboard), inserts via service role
ALTER TABLE wrong_answer_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers_read" ON wrong_answer_answers FOR SELECT USING (true);
