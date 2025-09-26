-- Create password_reset_otps table for storing OTP codes for password resets
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('client', 'coach', 'admin', 'staff')),
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email_otp ON password_reset_otps(email, otp);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Add cleanup function for expired OTPs (optional)
-- This can be called by a scheduled job to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_otps WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;