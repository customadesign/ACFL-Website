# Migration Guide: Fix Payment-Refund Data Integrity

## Quick Start

### Step 1: View Migrations
```bash
cd backend
npx tsx apply-migrations.ts
```

This will display all 3 migrations with instructions.

### Step 2: Apply Migrations in Supabase

1. Go to https://app.supabase.com/
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste each migration from the output above
6. Click **Run** after each migration

### Step 3: Verify
```bash
npx tsx check-db-constraints.ts
```

Should show:
- ✓ Payments table accessible
- ✓ Refunds table accessible
- ✓ No orphaned payments
- ✓ No status mismatches

### Step 4: Test (Optional - Development Only)
```bash
npx tsx test-migrations.ts
```

This creates and deletes test data to verify migrations work correctly.

---

## What These Migrations Do

### Migration 1: CASCADE Delete Constraint
**File:** `001_add_refund_constraints.sql`

When you delete a payment, all associated refunds are automatically deleted.

**Before:** Deleting a payment left orphaned refunds
**After:** Deleting a payment automatically deletes its refunds

### Migration 2: Status Reset Trigger
**File:** `002_add_refund_status_trigger.sql`

When you delete a refund, the payment status is automatically reset.

**Before:** Deleting a refund left payment status as "refunded"
**After:** Deleting the last refund resets payment status to "succeeded"

### Migration 3: Integrity Check Function
**File:** `003_add_data_integrity_checks.sql`

Provides a function to check and fix data integrity issues.

**Usage in SQL Editor:**
```sql
-- Check for issues
SELECT * FROM check_payment_refund_integrity(FALSE);

-- Fix issues automatically
SELECT * FROM check_payment_refund_integrity(TRUE);
```

---

## The Problem We're Solving

**What happened:**
- We deleted test payments manually
- This removed refund records from the database
- Payment statuses remained as "refunded" or "partially_refunded"
- This caused incorrect earnings calculations for coaches

**Why it matters:**
- Coaches see incorrect revenue
- Payout calculations are wrong
- Data integrity is compromised

**How we fix it:**
1. ✅ Add CASCADE constraint (deleting payment deletes refunds)
2. ✅ Add trigger (deleting refund resets payment status)
3. ✅ Add integrity check function (detect and fix issues)

---

## Testing the Solution

After applying migrations, you can test with these SQL queries in Supabase:

### Test 1: Check for Issues
```sql
SELECT * FROM check_payment_refund_integrity(FALSE);
```

Should return 0 rows (no issues found).

### Test 2: View All Refunds
```sql
SELECT
  r.id,
  r.payment_id,
  r.status as refund_status,
  p.status as payment_status,
  r.amount_cents,
  r.coach_penalty_cents
FROM refunds r
JOIN payments p ON p.id = r.payment_id
ORDER BY r.created_at DESC;
```

Payment status should match refund status.

### Test 3: Check Foreign Key Constraints
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'refunds'
AND tc.constraint_type = 'FOREIGN KEY';
```

Should show `delete_rule = 'CASCADE'` for `refunds_payment_id_fkey`.

---

## Rollback Instructions

If you need to undo these migrations:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_reset_payment_status_on_refund_delete ON refunds;
DROP FUNCTION IF EXISTS reset_payment_status_on_refund_delete();

-- Remove integrity check function
DROP FUNCTION IF EXISTS check_payment_refund_integrity(BOOLEAN);

-- Restore default foreign key (without CASCADE)
ALTER TABLE refunds DROP CONSTRAINT IF EXISTS refunds_payment_id_fkey;
ALTER TABLE refunds
ADD CONSTRAINT refunds_payment_id_fkey
FOREIGN KEY (payment_id)
REFERENCES payments(id);
```

---

## Future Best Practices

### When Deleting Test Data

**Option 1: Delete payments first** (recommended)
```typescript
// CASCADE will auto-delete refunds
await supabase.from('payments').delete().eq('id', paymentId);
```

**Option 2: Delete refunds first**
```typescript
// Trigger will auto-reset payment status
await supabase.from('refunds').delete().eq('payment_id', paymentId);
await supabase.from('payments').delete().eq('id', paymentId);
```

Both are now safe!

### Periodic Health Checks

Run this monthly to check data integrity:

```sql
SELECT * FROM check_payment_refund_integrity(FALSE);
```

If issues are found, investigate before fixing:
1. Why did the issue occur?
2. Is this a one-time problem or systematic?
3. Review the affected payments
4. Then fix: `SELECT * FROM check_payment_refund_integrity(TRUE);`

---

## Troubleshooting

### "Function does not exist"
**Problem:** `check_payment_refund_integrity` function not found

**Solution:** Run migration 003 in SQL Editor

### "Trigger not firing"
**Problem:** Payment status not resetting when refund deleted

**Solution:**
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_reset_payment_status_on_refund_delete';
   ```
2. If not found, run migration 002 again

### "CASCADE delete not working"
**Problem:** Refunds not deleted when payment deleted

**Solution:**
1. Check constraint:
   ```sql
   SELECT
     conname,
     confdeltype
   FROM pg_constraint
   WHERE conname = 'refunds_payment_id_fkey';
   ```
2. `confdeltype` should be 'c' (CASCADE)
3. If not, run migration 001 again

---

## Files Created

| File | Purpose |
|------|---------|
| `migrations/001_add_refund_constraints.sql` | Add CASCADE constraint |
| `migrations/002_add_refund_status_trigger.sql` | Add status reset trigger |
| `migrations/003_add_data_integrity_checks.sql` | Add integrity check function |
| `migrations/README.md` | Detailed migration documentation |
| `apply-migrations.ts` | Display migrations with instructions |
| `check-db-constraints.ts` | Verify database state |
| `test-migrations.ts` | Test migrations (dev only) |
| `MIGRATION_GUIDE.md` | This guide |

---

## Need Help?

1. **Check current state:**
   ```bash
   npx tsx check-db-constraints.ts
   ```

2. **View migrations:**
   ```bash
   npx tsx apply-migrations.ts
   ```

3. **Read detailed docs:**
   ```bash
   cat migrations/README.md
   ```

4. **Test in development:**
   ```bash
   npx tsx test-migrations.ts
   ```
