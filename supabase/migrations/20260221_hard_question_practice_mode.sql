begin;

create table if not exists public.practice_runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  question_id   uuid not null references public.questions(id) on delete cascade,
  practice_date date not null default current_date,
  created_at    timestamptz not null default now()
);

create unique index if not exists practice_runs_user_day_uniq
  on public.practice_runs (user_id, practice_date);

create index if not exists practice_runs_user_created_idx
  on public.practice_runs (user_id, created_at desc);

alter table public.practice_runs enable row level security;

do $$ begin
  create policy "practice_runs_select_own" on public.practice_runs
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

commit;
