-- Migration to update clients table to match required schema
-- This will create the new clients table structure and migrate existing data

-- Step 1: Create the new clients table with correct structure
CREATE TABLE public.clients_new (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  dob date,                       -- yyyy-mm-dd
  created_at timestamp with time zone default now()
);

-- Step 2: Enable RLS on the new table
ALTER TABLE public.clients_new ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY "client can select own row"
ON public.clients_new FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "client can insert own row"
ON public.clients_new FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "client can update own row"
ON public.clients_new FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 4: Migrate existing data from old clients table to new structure
-- Note: You'll need to get the email from the users table
INSERT INTO public.clients_new (id, email, first_name, last_name, phone, dob, created_at)
SELECT 
  c.user_id as id,
  u.email,
  c.first_name,
  c.last_name,
  c.phone,
  c.date_of_birth as dob,
  c.created_at
FROM public.clients c
JOIN public.users u ON c.user_id = u.id;

-- Step 5: Drop the old clients table (be careful!)
-- DROP TABLE public.clients;

-- Step 6: Rename new table to clients
-- ALTER TABLE public.clients_new RENAME TO clients;

-- IMPORTANT: Execute steps 5 and 6 only after verifying the migration worked correctly!
-- You can test by running: SELECT * FROM public.clients_new;