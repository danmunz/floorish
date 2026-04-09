-- ============================================================
-- Floorish: Room Regions
-- ============================================================

-- ── Rooms ──
-- Polygon regions drawn on a floor plan.

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references public.floor_plans(id) on delete cascade,
  name text not null,
  color text not null default '#5B8C6B',
  vertices jsonb not null,
  x double precision not null,
  y double precision not null,
  width_px double precision not null,
  height_px double precision not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "Users can CRUD own rooms"
  on public.rooms for all
  using (
    floor_plan_id in (
      select fp.id from public.floor_plans fp
      join public.projects p on fp.project_id = p.id
      where p.user_id = auth.uid()
    )
  )
  with check (
    floor_plan_id in (
      select fp.id from public.floor_plans fp
      join public.projects p on fp.project_id = p.id
      where p.user_id = auth.uid()
    )
  );

create policy "Shared rooms are readable"
  on public.rooms for select
  using (
    floor_plan_id in (
      select fp.id from public.floor_plans fp
      join public.shares s on fp.project_id = s.project_id
      join public.projects p on s.project_id = p.id
      where (s.expires_at is null or s.expires_at > now())
        and p.deleted_at is null
    )
  );

create trigger rooms_updated_at
  before update on public.rooms
  for each row execute function public.update_updated_at();

create index idx_rooms_floor_plan_id on public.rooms(floor_plan_id);


-- ── Alter room_photos: add room_id ──

alter table public.room_photos add column room_id uuid references public.rooms(id) on delete set null;
create index idx_room_photos_room_id on public.room_photos(room_id);


-- ── Alter style_generations: add room_id ──

alter table public.style_generations add column room_id uuid references public.rooms(id) on delete set null;
create index idx_style_generations_room_id on public.style_generations(room_id);
