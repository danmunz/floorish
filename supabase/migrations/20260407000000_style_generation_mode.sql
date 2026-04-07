-- Add mode column to style_generations to track staging vs restyle
alter table public.style_generations
  add column if not exists mode text default 'restyle';

comment on column public.style_generations.mode is 'AI generation mode: stage (virtual staging) or restyle (style transfer)';
