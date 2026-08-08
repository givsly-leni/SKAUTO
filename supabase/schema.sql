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
  make text,
  model text,
  vin text,
  engine_number text,
  odometer_km integer,
  vehicle_year integer,

  -- job
  status public.job_status not null default 'scheduled',
  cost numeric(10,2) not null default 0,
  notes text,
  restored_parts text[] not null default '{}',

  -- filled in automatically
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vehicles_vehicle_year_check
    check (vehicle_year is null or (vehicle_year between 1900 and 2100))
);

create index if not exists vehicles_user_id_idx on public.vehicles (user_id);
create index if not exists vehicles_status_idx on public.vehicles (user_id, status);
create index if not exists vehicles_registered_at_idx on public.vehicles (user_id, registered_at desc);
create index if not exists vehicles_plate_idx on public.vehicles (user_id, lower(license_plate));
create index if not exists vehicles_make_model_idx on public.vehicles (user_id, lower(make), lower(model));

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

-- ===========================================================================
-- ROLES: garage owner vs customer
-- The first account to register becomes the owner. Everyone after that is a
-- customer with read-only access to vehicles whose plate they have proven.
-- ===========================================================================

-- Plates are stored without separators (ΒΟΡ-6080 -> ΒΟΡ6080). Only separators
-- are stripped, never letters, so Greek plates survive intact.
create or replace function public.normalize_plate(p text)
returns text language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p, ''), '[\s\-\._/]', '', 'g'))
$$;

-- Phone numbers vary by country code and spacing; compare the last 9 digits.
create or replace function public.normalize_phone(p text)
returns text language sql immutable set search_path = '' as $$
  select right(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), 9)
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('owner', 'customer');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Guards against a customer updating their own row to role = 'owner'.
create or replace function public.prevent_role_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Role cannot be changed';
  end if;
  return new;
end;
$$;

create trigger profiles_no_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- Plates a customer has proven they own. Rows are only ever created by
-- claim_plate(), so there is deliberately no INSERT policy.
create table if not exists public.customer_plates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  license_plate text not null,
  created_at timestamptz not null default now(),
  unique (user_id, license_plate)
);

create index if not exists customer_plates_plate_idx
  on public.customer_plates (license_plate);

alter table public.customer_plates enable row level security;

create policy "Customers read own plates" on public.customer_plates
  for select using (auth.uid() = user_id);
create policy "Customers remove own plates" on public.customer_plates
  for delete using (auth.uid() = user_id);

-- First account in becomes the owner.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case when exists (select 1 from public.profiles where role = 'owner')
      then 'customer'::public.user_role
      else 'owner'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER so the vehicles policies can consult profiles without
-- tripping over that table's own RLS.
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
$$;

create or replace function public.owner_exists()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where role = 'owner')
$$;

-- Writing vehicles is owner-only; customers read the plates they've claimed.
drop policy if exists "Owner reads own vehicles" on public.vehicles;
create policy "Owner reads own vehicles" on public.vehicles
  for select using (auth.uid() = user_id and public.is_owner());
drop policy if exists "Owner inserts vehicles" on public.vehicles;
create policy "Owner inserts vehicles" on public.vehicles
  for insert with check (auth.uid() = user_id and public.is_owner());
drop policy if exists "Owner updates vehicles" on public.vehicles;
create policy "Owner updates vehicles" on public.vehicles
  for update using (auth.uid() = user_id and public.is_owner())
  with check (auth.uid() = user_id and public.is_owner());
drop policy if exists "Owner deletes vehicles" on public.vehicles;
create policy "Owner deletes vehicles" on public.vehicles
  for delete using (auth.uid() = user_id and public.is_owner());

create policy "Customers read claimed vehicles" on public.vehicles
  for select using (
    exists (
      select 1 from public.customer_plates cp
       where cp.user_id = auth.uid()
         and cp.license_plate = public.normalize_plate(vehicles.license_plate)
    )
  );

-- Claiming a plate requires the phone number already on file for that car,
-- because a plate alone is visible to anyone in a car park.
create or replace function public.claim_plate(p_plate text, p_phone text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_plate text := public.normalize_plate(p_plate);
  v_phone text := public.normalize_phone(p_phone);
  v_matches int;
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'error', 'You must be signed in.');
  end if;
  if v_plate = '' then
    return json_build_object('ok', false, 'error', 'Enter a license plate.');
  end if;
  if length(v_phone) < 6 then
    return json_build_object('ok', false, 'error', 'Enter the phone number the garage has on file.');
  end if;

  select count(*) into v_matches
    from public.vehicles v
   where public.normalize_plate(v.license_plate) = v_plate
     and public.normalize_phone(v.customer_phone) = v_phone;

  if v_matches = 0 then
    -- Deliberately vague: don't reveal whether the plate exists.
    return json_build_object('ok', false,
      'error', 'That plate and phone number do not match our records. Please check with the garage.');
  end if;

  insert into public.customer_plates (user_id, license_plate)
  values (auth.uid(), v_plate)
  on conflict (user_id, license_plate) do nothing;

  return json_build_object('ok', true, 'plate', v_plate, 'vehicles', v_matches);
end;
$$;

-- Grants: trigger functions unreachable over REST, claim requires a session,
-- owner_exists() stays anon-callable because the sign-in screen needs it.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_change() from public, anon, authenticated;
revoke all on function public.normalize_phone(text) from public, anon, authenticated;
revoke all on function public.claim_plate(text, text) from public, anon;
grant execute on function public.claim_plate(text, text) to authenticated;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;
-- Evaluated inside the vehicles SELECT policy as the calling user.
revoke all on function public.normalize_plate(text) from public, anon;
grant execute on function public.normalize_plate(text) to authenticated;
revoke all on function public.owner_exists() from public;
grant execute on function public.owner_exists() to anon, authenticated;
