-- ============================================================
-- Floorish: Style Visualizer Tables
-- ============================================================

-- ── Room Photos ──
-- User-uploaded photos of rooms, associated with a floor plan.

create table public.room_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  floor_plan_id uuid references public.floor_plans(id) on delete set null,
  image_path text not null,
  name text not null default 'Room Photo',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.room_photos enable row level security;

create policy "Users can CRUD own room photos"
  on public.room_photos for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "Shared room photos are readable"
  on public.room_photos for select
  using (
    project_id in (
      select s.project_id from public.shares s
      where (s.expires_at is null or s.expires_at > now())
    )
  );

create trigger room_photos_updated_at
  before update on public.room_photos
  for each row execute function public.update_updated_at();

create index idx_room_photos_project_id on public.room_photos(project_id);
create index idx_room_photos_floor_plan_id on public.room_photos(floor_plan_id);


-- ── Style Generations ──
-- Records of AI-generated style visualizations.

create table public.style_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_photo_id uuid references public.room_photos(id) on delete set null,
  style_preset text,
  prompt text not null,
  negative_prompt text,
  denoise_strength double precision not null default 0.65,
  result_image_path text,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.style_generations enable row level security;

create policy "Users can CRUD own style generations"
  on public.style_generations for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "Shared style generations are readable"
  on public.style_generations for select
  using (
    project_id in (
      select s.project_id from public.shares s
      where (s.expires_at is null or s.expires_at > now())
    )
  );

create trigger style_generations_updated_at
  before update on public.style_generations
  for each row execute function public.update_updated_at();

create index idx_style_generations_project_id on public.style_generations(project_id);
create index idx_style_generations_source_photo_id on public.style_generations(source_photo_id);
