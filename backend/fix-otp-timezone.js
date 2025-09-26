const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOTPTimezone() {
  try {
    console.log('Fixing password_reset_otps table timezone handling...');

    const fixSQL = `
      -- Drop existing table if it exists (this will remove any data)
      DROP TABLE IF EXISTS password_reset_otps;

      -- Create password_reset_otps table with proper timezone handling
      CREATE TABLE password_reset_otps (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,  -- Use TIMESTAMPTZ for proper timezone handling
          user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('client', 'coach', 'admin', 'staff')),
          user_id UUID NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),  -- Use TIMESTAMPTZ with NOW()
          UNIQUE(email)
      );

      -- Index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email_otp ON password_reset_otps(email, otp);
      CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

      -- Add cleanup function for expired OTPs
      CREATE OR REPLACE FUNCTION cleanup_expired_otps() RETURNS INTEGER AS $$
      DECLARE
          deleted_count INTEGER;
      BEGIN
          DELETE FROM password_reset_otps WHERE expires_at < NOW();
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;

      -- Test the timezone handling by showing current time
      SELECT NOW() as current_utc_time, NOW() + INTERVAL '30 minutes' as expiry_time_example;
    `;

    console.log('\n=== Please run this SQL in your Supabase SQL editor ===\n');
    console.log(fixSQL);
    console.log('\n=== End of SQL ===\n');

    console.log('This will fix the timezone issues with OTP expiry times!');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixOTPTimezone();