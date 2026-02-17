begin;

-- Add confucianism to the philosophy_school enum
ALTER TYPE public.philosophy_school ADD VALUE IF NOT EXISTS 'confucianism';

commit;

begin;

create table if not exists public.philosopher_corpus (
  id              uuid primary key default gen_random_uuid(),
  philosopher     text not null,
  school          public.philosophy_school not null,
  work            text not null,           -- e.g. 'Meditations', 'Republic'
  section         text,                    -- e.g. 'Book VII', 'Chapter 3'
  passage_text    text not null,
  word_count      integer not null,
  embedding       extensions.vector(1536),
  gutenberg_id    integer,                 -- Project Gutenberg book ID
  created_at      timestamptz not null default now()
);

create index if not exists corpus_philosopher_idx on public.philosopher_corpus (philosopher);
create index if not exists corpus_school_idx on public.philosopher_corpus (school);
create index if not exists corpus_work_idx on public.philosopher_corpus (work);

-- IVFFlat index for similarity search (use lists=50 for larger corpus)
-- Note: this index can only be created AFTER data is inserted (IVFFlat needs training data)
-- So we'll create it separately after seeding

-- RLS: everyone can read
alter table public.philosopher_corpus enable row level security;

do $$ begin
  create policy "corpus_select_all" on public.philosopher_corpus for select using (true);
exception when duplicate_object then null; end $$;

commit;
