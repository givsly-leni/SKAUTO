-- Starter schema for SKAUTO's Supabase project.
-- Run this in the Supabase SQL editor (or `supabase db push` with the CLI)
-- once you've created your project. Replace/extend once the real data
-- model is defined.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null
);

alter table public.items enable row level security;

-- Permissive starter policy — tighten this before shipping anything real.
create policy "Allow all access to items" on public.items
  for all
  using (true)
  with check (true);
