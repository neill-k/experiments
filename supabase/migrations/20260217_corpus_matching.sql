begin;

-- Match user answer embedding against the full philosopher corpus
-- Returns top passages ranked by cosine similarity
create or replace function public.match_corpus(
  p_answer_embedding extensions.vector(1536),
  p_match_count integer default 20
)
returns table (
  corpus_id    uuid,
  philosopher  text,
  school       public.philosophy_school,
  work         text,
  section      text,
  passage_text text,
  similarity   double precision
)
language sql
stable
security definer
set search_path = 'public', 'extensions'
as $$
  select
    pc.id as corpus_id,
    pc.philosopher,
    pc.school,
    pc.work,
    pc.section,
    pc.passage_text,
    1 - (pc.embedding <=> p_answer_embedding) as similarity
  from public.philosopher_corpus pc
  where pc.embedding is not null
  order by pc.embedding <=> p_answer_embedding
  limit p_match_count;
$$;

-- Match corpus but return only the top passage per philosopher (for discovery view)
-- Gets top 100 raw matches, then deduplicates to best per philosopher
create or replace function public.match_corpus_by_philosopher(
  p_answer_embedding extensions.vector(1536),
  p_top_n integer default 5
)
returns table (
  corpus_id    uuid,
  philosopher  text,
  school       public.philosophy_school,
  work         text,
  section      text,
  passage_text text,
  similarity   double precision
)
language sql
stable
security definer
set search_path = 'public', 'extensions'
as $$
  select distinct on (sub.philosopher)
    sub.corpus_id,
    sub.philosopher,
    sub.school,
    sub.work,
    sub.section,
    sub.passage_text,
    sub.similarity
  from (
    select
      pc.id as corpus_id,
      pc.philosopher,
      pc.school,
      pc.work,
      pc.section,
      pc.passage_text,
      1 - (pc.embedding <=> p_answer_embedding) as similarity
    from public.philosopher_corpus pc
    where pc.embedding is not null
    order by pc.embedding <=> p_answer_embedding
    limit 100
  ) sub
  order by sub.philosopher, sub.similarity desc
  limit p_top_n;
$$;

commit;
