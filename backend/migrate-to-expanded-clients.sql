-- ================================
-- Migration to Expanded Clients Table
-- ================================

-- Step 1: Drop existing clients table (if it has minimal data)
DROP TABLE IF EXISTS public.clients CASCADE;

-- Step 2: Create the new expanded clients table
-- ================================
-- Clients profile table (1:1 with auth.users)
-- ================================
create table if not exists public.clients (
  -- Link to Supabase auth user
  id uuid primary key references auth.users(id) on delete cascade,

  -- Core identity
  email                text not null unique,
  first_name           text not null,
  last_name            text not null,
  phone                text,
  dob                  date,                             -- yyyy-mm-dd

  -- Personal info
  location_state       text,                             -- e.g., "CA"
  gender_identity      text,
  ethnic_identity      text,
  religious_background text,
  preferred_language   text,

  -- Coaching preferences (multi-selects)
  areas_of_concern     text[] default '{}'::text[],
  availability         text[] default '{}'::text[],

  preferred_coach_gender text,
  bio                    text,

  -- Timestamps
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $
begin
  new.updated_at = now();
  return new;
end; $;

drop trigger if exists trg_clients_set_updated_at on public.clients;
create trigger trg_clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- Optional sanity checks
alter table public.clients
  add constraint chk_state_len
  check (location_state is null or char_length(location_state) between 2 and 32);

-- Helpful indexes (unique on email already exists from the constraint)
create index if not exists idx_clients_last_first on public.clients (last_name, first_name);
create index if not exists idx_clients_areas_gin on public.clients using gin (areas_of_concern);
create index if not exists idx_clients_availability_gin on public.clients using gin (availability);

-- ================================
-- Row Level Security
-- ================================
alter table public.clients enable row level security;

-- Authenticated users can read their own row
drop policy if exists "client can select own row" on public.clients;
create policy "client can select own row"
on public.clients for select
to authenticated
using (auth.uid() = id);

-- Authenticated users can insert only their own row
drop policy if exists "client can insert own row" on public.clients;
create policy "client can insert own row"
on public.clients for insert
to authenticated
with check (auth.uid() = id);

-- Authenticated users can update only their own row
drop policy if exists "client can update own row" on public.clients;
create policy "client can update own row"
on public.clients for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Service role (server key) full access for backend jobs/admin
drop policy if exists "service role full access" on public.clients;
create policy "service role full access"
on public.clients
as permissive
for all
to authenticated
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');