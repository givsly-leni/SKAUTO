-- SKAUTO database schema (already applied to the live Supabase project).
-- Kept here as the source of truth / for recreating the database elsewhere.

-- ---------------------------------------------------------------------------
-- Job lifecycle: a car is booked in, being worked on, or finished.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('scheduled', 'in_progress', 'completed');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Vehicles / job records
-- ---------------------------------------------------------------------------
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- customer
  customer_name text not null,
  customer_phone text,

  -- vehicle identity
  license_plate text not null,
  vin text,
  vehicle_date date,

  -- job
  status public.job_status not null default 'scheduled',
  cost numeric(10,2) not null default 0,
  notes text,
  restored_parts text[] not null default '{}',

  -- filled in automatically
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_user_id_idx on public.vehicles (user_id);
create index if not exists vehicles_status_idx on public.vehicles (user_id, status);
create index if not exists vehicles_registered_at_idx on public.vehicles (user_id, registered_at desc);
create index if not exists vehicles_plate_idx on public.vehicles (user_id, lower(license_plate));

-- keep updated_at fresh on every write
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: an account can only ever touch its own records.
-- ---------------------------------------------------------------------------
alter table public.vehicles enable row level security;

drop policy if exists "Users read own vehicles" on public.vehicles;
create policy "Users read own vehicles" on public.vehicles
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own vehicles" on public.vehicles;
create policy "Users insert own vehicles" on public.vehicles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own vehicles" on public.vehicles;
create policy "Users update own vehicles" on public.vehicles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own vehicles" on public.vehicles;
create policy "Users delete own vehicles" on public.vehicles
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Single-user lock: the login screen calls this to decide whether to show the
-- register form. Returns false once the first account exists. Exposes nothing
-- but a boolean.
-- ---------------------------------------------------------------------------
create or replace function public.signup_available()
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select not exists (select 1 from auth.users);
$$;

revoke all on function public.signup_available() from public;
grant execute on function public.signup_available() to anon, authenticated;
