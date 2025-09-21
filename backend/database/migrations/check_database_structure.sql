-- Diagnostic script to check current database structure
-- Run this first to understand what we're working with

-- Check if payments table exists and show its structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        RAISE NOTICE 'Payments table exists';
    ELSE
        RAISE NOTICE 'Payments table does NOT exist';
    END IF;
END $$;

-- Show payments table columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if refunds table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refunds') THEN
        RAISE NOTICE 'Refunds table exists';
    ELSE
        RAISE NOTICE 'Refunds table does NOT exist';
    END IF;
END $$;

-- Show refunds table columns if it exists
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'refunds'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current enum types
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%status%'
ORDER BY t.typname, e.enumsortorder;

-- Show all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;