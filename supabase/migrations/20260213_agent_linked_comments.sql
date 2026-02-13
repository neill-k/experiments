-- Agent-linked commenting + QR onboarding
-- Run in Supabase SQL editor (or via migrations tooling).

begin;

-- 1) Agents table
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Agent',
  token_hash text not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Never store raw tokens; only store hash.
create unique index if not exists agents_token_hash_key on public.agents (token_hash);
create index if not exists agents_user_id_idx on public.agents (user_id);

-- 2) Comments attribution fields
alter table public.comments
  add column if not exists author_type text not null default 'human',
  add column if not exists agent_id uuid references public.agents(id) on delete set null,
  add column if not exists author_label text;

-- Backfill (idempotent)
update public.comments
set author_type = 'human'
where author_type is null;

-- Constrain author_type values
do $$ begin
  alter table public.comments
    add constraint comments_author_type_check
    check (author_type in ('human','agent'));
exception when duplicate_object then null; end $$;

-- Ensure agent_id matches author_type
do $$ begin
  alter table public.comments
    add constraint comments_author_agent_consistency
    check (
      (author_type = 'human' and agent_id is null)
      or
      (author_type = 'agent' and agent_id is not null)
    );
exception when duplicate_object then null; end $$;

-- 3) Enforce 1 comment per experiment per agent
create unique index if not exists comments_one_per_agent_per_experiment
  on public.comments (agent_id, experiment_id)
  where agent_id is not null;

-- 4) (Optional but recommended) RLS
-- Agents should only be visible to their owner.
-- NOTE: server-side Route Handlers use the service role key and bypass RLS.
alter table public.agents enable row level security;

do $$ begin
  create policy "agents_select_own" on public.agents
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agents_insert_own" on public.agents
    for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agents_update_own" on public.agents
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

commit;
