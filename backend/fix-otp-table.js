const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOTPTable() {
  try {
    console.log('Fixing password_reset_otps table user_id column...');

    // Drop and recreate table with correct UUID type
    const fixSQL = `
      -- Drop existing table if it exists (this will remove any data)
      DROP TABLE IF EXISTS password_reset_otps;

      -- Create password_reset_otps table with correct UUID type
      CREATE TABLE password_reset_otps (
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
    `;

    console.log('\n=== Please run this SQL in your Supabase SQL editor ===\n');
    console.log(fixSQL);
    console.log('\n=== End of SQL ===\n');

    console.log('After running the SQL above, your password reset functionality will work correctly!');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixOTPTable();