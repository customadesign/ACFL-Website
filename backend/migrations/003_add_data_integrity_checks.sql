-- Migration: Add data integrity check function
-- This function can be run periodically to identify and optionally fix data inconsistencies

CREATE OR REPLACE FUNCTION check_payment_refund_integrity(fix_issues BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
    issue_type TEXT,
    payment_id UUID,
    current_status TEXT,
    expected_status TEXT,
    action_taken TEXT
) AS $$
BEGIN
    -- Check for payments marked as refunded/partially_refunded without refund records
    RETURN QUERY
    SELECT
        'orphaned_refund_status'::TEXT as issue_type,
        p.id as payment_id,
        p.status as current_status,
        'succeeded'::TEXT as expected_status,
        CASE
            WHEN fix_issues THEN 'FIXED: Reset to succeeded'
            ELSE 'NOT FIXED: Run with fix_issues=TRUE to fix'
        END as action_taken
    FROM payments p
    WHERE p.status IN ('refunded', 'partially_refunded')
    AND NOT EXISTS (
        SELECT 1 FROM refunds r
        WHERE r.payment_id = p.id
        AND r.status = 'succeeded'
    );

    -- If fix_issues is TRUE, update the orphaned payments
    IF fix_issues THEN
        UPDATE payments
        SET status = 'succeeded',
            updated_at = NOW()
        WHERE status IN ('refunded', 'partially_refunded')
        AND NOT EXISTS (
            SELECT 1 FROM refunds r
            WHERE r.payment_id = payments.id
            AND r.status = 'succeeded'
        );
    END IF;

    -- Check for payments marked as succeeded that have refund records
    RETURN QUERY
    SELECT
        'missing_refund_status'::TEXT as issue_type,
        p.id as payment_id,
        p.status as current_status,
        CASE
            WHEN (SELECT SUM(r.amount_cents) FROM refunds r WHERE r.payment_id = p.id AND r.status = 'succeeded') >= p.amount_cents
            THEN 'refunded'
            ELSE 'partially_refunded'
        END::TEXT as expected_status,
        CASE
            WHEN fix_issues THEN 'FIXED: Updated to refunded/partially_refunded'
            ELSE 'NOT FIXED: Run with fix_issues=TRUE to fix'
        END as action_taken
    FROM payments p
    WHERE p.status = 'succeeded'
    AND EXISTS (
        SELECT 1 FROM refunds r
        WHERE r.payment_id = p.id
        AND r.status = 'succeeded'
    );

    -- If fix_issues is TRUE, update payments with refunds
    IF fix_issues THEN
        UPDATE payments
        SET status = CASE
            WHEN (SELECT SUM(r.amount_cents) FROM refunds r WHERE r.payment_id = payments.id AND r.status = 'succeeded') >= payments.amount_cents
            THEN 'refunded'
            ELSE 'partially_refunded'
        END,
        updated_at = NOW()
        WHERE status = 'succeeded'
        AND EXISTS (
            SELECT 1 FROM refunds r
            WHERE r.payment_id = payments.id
            AND r.status = 'succeeded'
        );
    END IF;

END;
$$ LANGUAGE plpgsql;

-- Comment explaining the function
COMMENT ON FUNCTION check_payment_refund_integrity(BOOLEAN) IS
'Checks for data integrity issues between payments and refunds tables. Set fix_issues=TRUE to automatically fix issues.';

-- Example usage:
-- To check for issues: SELECT * FROM check_payment_refund_integrity(FALSE);
-- To fix issues: SELECT * FROM check_payment_refund_integrity(TRUE);
