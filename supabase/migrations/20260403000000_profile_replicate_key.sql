-- Add Replicate API key storage to profiles for cross-device persistence.

alter table public.profiles
  add column if not exists replicate_api_key text;
