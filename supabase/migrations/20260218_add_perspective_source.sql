-- Add source citation column to philosopher_perspectives
-- Per user feedback: perspectives must be real quotes with source citations

alter table public.philosopher_perspectives
  add column if not exists source text;

comment on column public.philosopher_perspectives.source is
  'Citation for the perspective text, e.g. "Meditations, Book V" or "Being and Nothingness, Ch. 2"';
