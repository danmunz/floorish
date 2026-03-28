-- Add soft-delete support for projects to prevent accidental permanent data loss.

alter table public.projects
  add column if not exists deleted_at timestamptz;

create index if not exists idx_projects_user_deleted_at
  on public.projects(user_id, deleted_at);
