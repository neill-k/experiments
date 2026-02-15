-- Enable RLS on experiments and comments tables.
-- Apply consistent, minimal-privilege policies.
-- Server-side Route Handlers use the service role key and bypass RLS.

begin;

-- ============================================================
-- EXPERIMENTS
-- ============================================================
alter table public.experiments enable row level security;

-- Anyone can read experiments (public site).
do $$ begin
  create policy "experiments_select_all" on public.experiments
    for select
    using (true);
exception when duplicate_object then null; end $$;

-- Only authenticated users can insert (used by comments upsert).
do $$ begin
  create policy "experiments_insert_authenticated" on public.experiments
    for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

-- No client-side update or delete on experiments.
-- (Service role handles any admin changes.)

-- ============================================================
-- COMMENTS
-- ============================================================
alter table public.comments enable row level security;

-- Anyone can read comments (public).
do $$ begin
  create policy "comments_select_all" on public.comments
    for select
    using (true);
exception when duplicate_object then null; end $$;

-- Authenticated users can insert their own comments only.
do $$ begin
  create policy "comments_insert_own" on public.comments
    for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Users can soft-delete (update is_deleted) only their own comments.
do $$ begin
  create policy "comments_update_own" on public.comments
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- No client-side hard delete.
-- (Prevents permanent removal via anon key.)

commit;
