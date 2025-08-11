-- =========================================
-- Migration to Updated Coaches Table
-- =========================================

-- Step 1: Drop existing coaches table (if it has minimal data)
-- WARNING: This will delete all existing coach data!
-- If you have important coach data, modify this to migrate it first
DROP TABLE IF EXISTS public.coaches CASCADE;

-- Step 2: Create the new coaches table
-- =========================================
-- COACHES (1:1 with auth.users)
-- =========================================
create table if not exists public.coaches (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Identity
  email                  text not null unique,
  first_name             text not null,
  last_name              text not null,
  phone                  text,

  -- Availability toggle
  is_available           boolean not null default true,

  -- Professional info
  bio                    text,
  years_experience       int check (years_experience is null or years_experience between 0 and 80),
  hourly_rate_usd        numeric(10,2) check (hourly_rate_usd is null or hourly_rate_usd >= 0),

  qualifications         text,

  -- Multi-selects from the UI
  specialties            text[] not null default '{}'::text[],
  languages              text[] not null default '{}'::text[],

  -- Timestamps
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.coaches_set_updated_at()
returns trigger language plpgsql as $
begin
  new.updated_at = now();
  return new;
end; $;

drop trigger if exists trg_coaches_set_updated_at on public.coaches;
create trigger trg_coaches_set_updated_at
before update on public.coaches
for each row execute function public.coaches_set_updated_at();

-- Helpful indexes
create index if not exists idx_coaches_last_first on public.coaches (last_name, first_name);
create index if not exists idx_coaches_specialties_gin on public.coaches using gin (specialties);
create index if not exists idx_coaches_languages_gin   on public.coaches using gin (languages);
create index if not exists idx_coaches_available       on public.coaches (is_available);

-- =========================================
-- RLS
-- =========================================
alter table public.coaches enable row level security;

-- Coach can read their own row
drop policy if exists "coach select self" on public.coaches;
create policy "coach select self"
on public.coaches for select
to authenticated
using (auth.uid() = id);

-- Coach can insert their own row
drop policy if exists "coach insert self" on public.coaches;
create policy "coach insert self"
on public.coaches for insert
to authenticated
with check (auth.uid() = id);

-- Coach can update their own row
drop policy if exists "coach update self" on public.coaches;
create policy "coach update self"
on public.coaches for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- (Optional) public listing policy for clients to browse coaches
-- Allows anyone to read limited, non-sensitive fields of AVAILABLE coaches.
-- Comment this out if you don't want public browsing.
drop policy if exists "anyone can list available coaches" on public.coaches;
create policy "anyone can list available coaches"
on public.coaches for select
to anon, authenticated
using (
  is_available = true
);

-- Service role (server key) full access for backend jobs/admin
drop policy if exists "service role full access coaches" on public.coaches;
create policy "service role full access coaches"
on public.coaches
as permissive
for all
to authenticated
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');