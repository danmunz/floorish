-- Fix RLS recursion between projects and shares policies.
--
-- Root cause:
-- - projects SELECT policy reads from shares
-- - shares ALL policy reads from projects
-- This creates a recursive policy evaluation loop and causes 42P17.

-- Drop the recursive ALL policy on shares.
drop policy if exists "Owners can manage shares" on public.shares;

-- Keep public token-based read behavior via existing SELECT policy.
-- Restore owner write permissions with command-specific policies.
create policy "Owners can insert shares"
  on public.shares for insert
  with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "Owners can update shares"
  on public.shares for update
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "Owners can delete shares"
  on public.shares for delete
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
