-- Migration: Add trigger to update payment status when refund is deleted
-- This prevents orphaned payment statuses (payments marked as refunded with no refund record)
-- When a refund is deleted, the payment status is reset to 'succeeded'

-- Create function that will be called by the trigger
CREATE OR REPLACE FUNCTION reset_payment_status_on_refund_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When a refund is deleted, check if there are any other refunds for this payment
    IF NOT EXISTS (
        SELECT 1 FROM refunds
        WHERE payment_id = OLD.payment_id
        AND id != OLD.id
    ) THEN
        -- No other refunds exist, reset the payment status to 'succeeded'
        UPDATE payments
        SET status = 'succeeded',
            updated_at = NOW()
        WHERE id = OLD.payment_id
        AND status IN ('refunded', 'partially_refunded');
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after a refund is deleted
DROP TRIGGER IF EXISTS trigger_reset_payment_status_on_refund_delete ON refunds;

CREATE TRIGGER trigger_reset_payment_status_on_refund_delete
AFTER DELETE ON refunds
FOR EACH ROW
EXECUTE FUNCTION reset_payment_status_on_refund_delete();

-- Comment explaining the trigger
COMMENT ON FUNCTION reset_payment_status_on_refund_delete() IS
'Automatically resets payment status to succeeded when the last refund is deleted, preventing orphaned refunded statuses';
