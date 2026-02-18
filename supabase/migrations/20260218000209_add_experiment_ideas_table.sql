-- Experiment ideas table for the ideator skill
create table if not exists experiment_ideas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  tags text[] not null default '{}',
  persona text,
  mood text,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'built', 'rejected')),
  run_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for status filtering and dedup searches
create index idx_experiment_ideas_status on experiment_ideas (status);
create index idx_experiment_ideas_created on experiment_ideas (created_at desc);

-- Enable RLS
alter table experiment_ideas enable row level security;

-- Service role can do everything
create policy "Service role full access" on experiment_ideas
  for all using (true) with check (true);
