const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runOTPMigration() {
  try {
    console.log('Creating password_reset_otps table...');

    // Create the table
    let createTableError = null;
    try {
      const result = await supabase.rpc('exec_sql', {
        query: `
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
        `
      });
      createTableError = result.error;
    } catch (err) {
      createTableError = err;
    }

    if (createTableError) {
      console.log('RPC failed, trying alternative method...');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
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
      `);
      return;
    }

    // Create indexes
    console.log('Creating indexes...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email_otp ON password_reset_otps(email, otp)',
      'CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        const result = await supabase.rpc('exec_sql', { query: indexQuery });
        if (result.error) {
          console.log(`Index creation failed: ${indexQuery}`);
        }
      } catch (err) {
        console.log(`Index creation failed: ${indexQuery} - ${err.message}`);
      }
    }

    // Create cleanup function
    console.log('Creating cleanup function...');

    try {
      const result = await supabase.rpc('exec_sql', {
        query: `
          CREATE OR REPLACE FUNCTION cleanup_expired_otps() RETURNS INTEGER AS $$
          DECLARE
              deleted_count INTEGER;
          BEGIN
              DELETE FROM password_reset_otps WHERE expires_at < NOW();
              GET DIAGNOSTICS deleted_count = ROW_COUNT;
              RETURN deleted_count;
          END;
          $$ LANGUAGE plpgsql;
        `
      });

      if (result.error) {
        console.log('Function creation failed, but table should still work');
      }
    } catch (err) {
      console.log('Function creation failed, but table should still work');
    }

    console.log('OTP Migration completed successfully!');
    console.log('The password reset functionality should now work for clients and coaches.');

  } catch (error) {
    console.error('OTP Migration failed:', error);
    process.exit(1);
  }
}

runOTPMigration();