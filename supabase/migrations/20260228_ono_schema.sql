-- O(no) - Competitive programming platform for maximally inefficient solutions
-- Schema for problems, solutions, scores, and community votes

-- Problem difficulty (how hard it is to make the solution terrible)
CREATE TYPE ono_difficulty AS ENUM ('trivial', 'easy', 'medium', 'hard', 'legendary');

-- Problem category
CREATE TYPE ono_category AS ENUM ('classic', 'scale', 'ml', 'systems');

-- Vote type
CREATE TYPE ono_vote_type AS ENUM ('upvote', 'i_hate_this', 'would_pass_review');

-- ────────────────────────────────────────────────
-- Problems
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ono_problems (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL,           -- deadpan serious problem statement
  constraints   text,                     -- additional constraints (displayed)
  category      ono_category NOT NULL DEFAULT 'classic',
  difficulty    ono_difficulty NOT NULL DEFAULT 'medium', -- how hard to make it terrible
  function_name text NOT NULL,            -- entry point function name
  function_sig  text NOT NULL,            -- human-readable signature
  test_cases    jsonb NOT NULL DEFAULT '[]',  -- [{input: [...], expected: ...}]
  optimal_code  text,                     -- reference optimal solution (not shown to users)
  optimal_loc   int NOT NULL DEFAULT 10,  -- lines of code in optimal solution
  optimal_time_ms float NOT NULL DEFAULT 1.0,  -- baseline execution time
  optimal_memory_bytes bigint NOT NULL DEFAULT 1048576, -- baseline memory (1MB default)
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ono_problems_active ON ono_problems (is_active, created_at DESC);
CREATE INDEX idx_ono_problems_category ON ono_problems (category);
CREATE INDEX idx_ono_problems_slug ON ono_problems (slug);

-- ────────────────────────────────────────────────
-- Solutions
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ono_solutions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id      uuid NOT NULL REFERENCES ono_problems(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_repo_url text NOT NULL,          -- public GitHub repo URL
  github_username text NOT NULL,          -- submitter's GitHub username
  source_code     text NOT NULL,          -- fetched solution code (snapshot at submission time)

  -- Execution results
  all_tests_passed boolean NOT NULL DEFAULT false,
  test_results     jsonb NOT NULL DEFAULT '[]',  -- per-test pass/fail + timing

  -- Automated scores
  total_score          float NOT NULL DEFAULT 0,
  computational_waste  float NOT NULL DEFAULT 0,   -- time + memory waste score
  overengineering      float NOT NULL DEFAULT 0,   -- LOC, functions, classes, imports
  style_points         float NOT NULL DEFAULT 0,   -- naming, comments, conversions

  -- Raw metrics
  execution_time_ms    float NOT NULL DEFAULT 0,
  peak_memory_bytes    bigint NOT NULL DEFAULT 0,
  loc                  int NOT NULL DEFAULT 0,
  num_functions        int NOT NULL DEFAULT 0,
  num_classes          int NOT NULL DEFAULT 0,
  num_imports          int NOT NULL DEFAULT 0,
  avg_name_length      float NOT NULL DEFAULT 0,
  long_names_count     int NOT NULL DEFAULT 0,
  comment_lines        int NOT NULL DEFAULT 0,
  total_lines          int NOT NULL DEFAULT 0,

  -- Community scores (denormalized for leaderboard perf)
  upvotes              int NOT NULL DEFAULT 0,
  i_hate_this_count    int NOT NULL DEFAULT 0,
  would_pass_review    int NOT NULL DEFAULT 0,

  -- Metadata
  execution_error text,                   -- error message if execution failed
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ono_solutions_problem ON ono_solutions (problem_id, total_score DESC);
CREATE INDEX idx_ono_solutions_user ON ono_solutions (user_id, created_at DESC);
CREATE INDEX idx_ono_solutions_leaderboard ON ono_solutions (problem_id, all_tests_passed, total_score DESC);

-- ────────────────────────────────────────────────
-- Votes
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ono_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid NOT NULL REFERENCES ono_solutions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type   ono_vote_type NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (solution_id, user_id, vote_type)
);

CREATE INDEX idx_ono_votes_solution ON ono_votes (solution_id, vote_type);

-- ────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────
ALTER TABLE ono_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE ono_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ono_votes ENABLE ROW LEVEL SECURITY;

-- Problems: anyone can read active problems
CREATE POLICY "Anyone can read active problems"
  ON ono_problems FOR SELECT
  USING (is_active = true);

-- Solutions: anyone can read solutions that passed all tests
CREATE POLICY "Anyone can read passing solutions"
  ON ono_solutions FOR SELECT
  USING (all_tests_passed = true);

-- Solutions: authenticated users can read their own (even failing)
CREATE POLICY "Users can read own solutions"
  ON ono_solutions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Solutions: authenticated users can insert their own
CREATE POLICY "Users can insert own solutions"
  ON ono_solutions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Votes: anyone can read
CREATE POLICY "Anyone can read votes"
  ON ono_votes FOR SELECT
  USING (true);

-- Votes: authenticated users can insert their own
CREATE POLICY "Users can insert own votes"
  ON ono_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Votes: authenticated users can delete their own
CREATE POLICY "Users can delete own votes"
  ON ono_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────
-- Trigger: update vote counts on ono_solutions
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ono_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ono_solutions SET
      upvotes = upvotes + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE 0 END,
      i_hate_this_count = i_hate_this_count + CASE WHEN NEW.vote_type = 'i_hate_this' THEN 1 ELSE 0 END,
      would_pass_review = would_pass_review + CASE WHEN NEW.vote_type = 'would_pass_review' THEN 1 ELSE 0 END
    WHERE id = NEW.solution_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ono_solutions SET
      upvotes = GREATEST(0, upvotes - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE 0 END),
      i_hate_this_count = GREATEST(0, i_hate_this_count - CASE WHEN OLD.vote_type = 'i_hate_this' THEN 1 ELSE 0 END),
      would_pass_review = GREATEST(0, would_pass_review - CASE WHEN OLD.vote_type = 'would_pass_review' THEN 1 ELSE 0 END)
    WHERE id = OLD.solution_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ono_vote_counts
  AFTER INSERT OR DELETE ON ono_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_ono_vote_counts();
