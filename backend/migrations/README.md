# Database Migrations

## Overview

These migrations fix data integrity issues between the `payments` and `refunds` tables. The problem occurred when test payments were deleted, which removed refund records but left payment statuses as "refunded" or "partially_refunded".

## Problem Statement

**Issue:** When we cleaned test payments, refund records were deleted but payment statuses weren't updated.

**Impact:** Coaches see payments as "succeeded" when they were actually refunded, or vice versa.

**Solution:**
1. Add database constraints (cascade deletes)
2. Add triggers to update payment status when refund is deleted
3. Add data integrity check function

## Migration Files

### 001_add_refund_constraints.sql
**Purpose:** Adds CASCADE delete constraint to the refunds table

**What it does:**
- Ensures that when a payment is deleted, all associated refunds are automatically deleted
- Adds an index on `payment_id` for better query performance
- Prevents orphaned refund records

**Safety:** This is a safe migration that adds referential integrity

---

### 002_add_refund_status_trigger.sql
**Purpose:** Automatically updates payment status when refunds are deleted

**What it does:**
- Creates a PostgreSQL trigger function `reset_payment_status_on_refund_delete()`
- When a refund is deleted, checks if there are any other refunds for that payment
- If no other refunds exist, resets the payment status from 'refunded'/'partially_refunded' back to 'succeeded'
- Updates the `updated_at` timestamp

**Safety:** This trigger only fires on DELETE operations and only updates payments that are currently marked as refunded

---

### 003_add_data_integrity_checks.sql
**Purpose:** Provides a function to check and fix data integrity issues

**What it does:**
- Creates function `check_payment_refund_integrity(fix_issues BOOLEAN)`
- Identifies two types of issues:
  1. **Orphaned refund status:** Payments marked as refunded with no refund records
  2. **Missing refund status:** Payments marked as succeeded that have refund records
- Can run in check-only mode (`FALSE`) or auto-fix mode (`TRUE`)

**Usage:**
```sql
-- Check for issues without fixing
SELECT * FROM check_payment_refund_integrity(FALSE);

-- Check and automatically fix issues
SELECT * FROM check_payment_refund_integrity(TRUE);
```

## How to Apply Migrations

Since Supabase requires manual SQL execution for DDL changes:

1. **Go to Supabase Dashboard:** https://app.supabase.com/
2. **Select your project**
3. **Navigate to "SQL Editor"** (left sidebar)
4. **Click "New Query"**
5. **Copy and paste each migration** (one at a time, in order)
6. **Click "Run"** after pasting each migration

### Quick Command

To see all migrations with instructions:
```bash
npx tsx apply-migrations.ts
```

## Verification

After applying migrations, run the verification script:

```bash
npx tsx check-db-constraints.ts
```

This will:
- ✓ Verify payments table is accessible
- ✓ Verify refunds table is accessible
- ✓ Check for orphaned payment statuses
- ✓ Check for status mismatches

## Testing the Integrity Function

After applying migration 003, test the integrity check function in SQL Editor:

```sql
-- See what issues exist (if any)
SELECT * FROM check_payment_refund_integrity(FALSE);

-- If issues are found and you want to fix them
SELECT * FROM check_payment_refund_integrity(TRUE);
```

## Future Maintenance

### Periodic Integrity Checks

Consider running integrity checks periodically:

```sql
SELECT * FROM check_payment_refund_integrity(FALSE);
```

### If You Need to Delete Test Data

When deleting test payments in the future:

1. **Delete payments first** - The CASCADE constraint will automatically delete associated refunds
2. **OR delete refunds first** - The trigger will automatically reset payment statuses

Either approach is now safe.

## Rollback (If Needed)

If you need to rollback these migrations:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_reset_payment_status_on_refund_delete ON refunds;
DROP FUNCTION IF EXISTS reset_payment_status_on_refund_delete();

-- Remove integrity check function
DROP FUNCTION IF EXISTS check_payment_refund_integrity(BOOLEAN);

-- Remove constraint (restore to default FK)
ALTER TABLE refunds DROP CONSTRAINT IF EXISTS refunds_payment_id_fkey;
ALTER TABLE refunds
ADD CONSTRAINT refunds_payment_id_fkey
FOREIGN KEY (payment_id)
REFERENCES payments(id);
```

## Technical Details

### Database Schema Affected

**Tables:**
- `payments` (id, status, updated_at)
- `refunds` (id, payment_id, status)

**New Constraints:**
- `refunds_payment_id_fkey` with `ON DELETE CASCADE`

**New Triggers:**
- `trigger_reset_payment_status_on_refund_delete`

**New Functions:**
- `reset_payment_status_on_refund_delete()` - Trigger function
- `check_payment_refund_integrity(BOOLEAN)` - Integrity check function

### Performance Impact

- **Minimal:** Triggers only fire on DELETE operations (which are infrequent)
- **Index added:** `idx_refunds_payment_id` improves foreign key lookup performance
- **Integrity checks:** Should be run manually, not automatically on every operation

## Questions?

If you encounter any issues applying these migrations, check:
1. Do you have proper permissions in Supabase?
2. Are the table names correct (`payments` and `refunds`)?
3. Do you have any conflicting constraints already in place?

Run the verification script to see detailed error messages:
```bash
npx tsx check-db-constraints.ts
```
