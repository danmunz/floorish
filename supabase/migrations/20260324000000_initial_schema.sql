-- ============================================================
-- Floorish: Initial Schema
-- ============================================================

-- ── Profiles ──
-- Auto-created when a user signs up via auth trigger.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── Projects ──

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Untitled Project',
  settings jsonb not null default '{"showGrid": true, "gridSizeIn": 12, "snapToGrid": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── Floor Plans ──

create table public.floor_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  image_path text,
  pixels_per_foot double precision,
  calibration_points jsonb,
  calibration_distance_ft double precision,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.floor_plans enable row level security;

create policy "Users can CRUD own floor plans"
  on public.floor_plans for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );


-- ── Furniture ──

create table public.furniture (
  id uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references public.floor_plans(id) on delete cascade,
  preset_id text,
  name text not null,
  x double precision not null,
  y double precision not null,
  width_px double precision not null,
  height_px double precision not null,
  rotation double precision not null default 0,
  color text not null,
  shape text not null default 'rect',
  vertices jsonb,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.furniture enable row level security;

create policy "Users can CRUD own furniture"
  on public.furniture for all
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


-- ── Shares ──

create table public.shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.shares enable row level security;

-- Owners can manage their shares
create policy "Owners can manage shares"
  on public.shares for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Anyone with a valid token can read the share record
create policy "Anyone can read share by token"
  on public.shares for select
  using (true);

-- Shared project read access for floor_plans
create policy "Shared floor plans are readable"
  on public.floor_plans for select
  using (
    project_id in (
      select s.project_id from public.shares s
      where (s.expires_at is null or s.expires_at > now())
    )
  );

-- Shared project read access for furniture
create policy "Shared furniture is readable"
  on public.furniture for select
  using (
    floor_plan_id in (
      select fp.id from public.floor_plans fp
      join public.shares s on fp.project_id = s.project_id
      where (s.expires_at is null or s.expires_at > now())
    )
  );

-- Shared project read access for projects
create policy "Shared projects are readable"
  on public.projects for select
  using (
    id in (
      select s.project_id from public.shares s
      where (s.expires_at is null or s.expires_at > now())
    )
  );


-- ── Auto-update updated_at ──

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at();

create trigger floor_plans_updated_at
  before update on public.floor_plans
  for each row execute function public.update_updated_at();

create trigger furniture_updated_at
  before update on public.furniture
  for each row execute function public.update_updated_at();


-- ── Indexes ──

create index idx_projects_user_id on public.projects(user_id);
create index idx_floor_plans_project_id on public.floor_plans(project_id);
create index idx_furniture_floor_plan_id on public.furniture(floor_plan_id);
create index idx_shares_token on public.shares(token);
create index idx_shares_project_id on public.shares(project_id);
