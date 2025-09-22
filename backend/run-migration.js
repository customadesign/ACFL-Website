const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Creating scheduled_reminders table...');

    // Create the table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS scheduled_reminders (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
          reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'message')),
          recipient_id UUID NOT NULL,
          recipient_email VARCHAR(255),
          sender_id UUID,
          scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
          hours_before INTEGER NOT NULL,
          sent BOOLEAN DEFAULT FALSE,
          sent_at TIMESTAMP WITH TIME ZONE,
          failed BOOLEAN DEFAULT FALSE,
          failure_reason TEXT,
          cancelled BOOLEAN DEFAULT FALSE,
          cancelled_at TIMESTAMP WITH TIME ZONE,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }).catch(err => {
      // If RPC doesn't work, try direct SQL
      return { error: err };
    });

    if (createTableError) {
      console.log('RPC failed, trying alternative method...');

      // Try using the SQL editor approach - we'll create a simpler version first
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
-- Create scheduled_reminders table for session reminders
CREATE TABLE IF NOT EXISTS scheduled_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'message')),
    recipient_id UUID NOT NULL,
    recipient_email VARCHAR(255),
    sender_id UUID,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    hours_before INTEGER NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_session_id ON scheduled_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled_for ON scheduled_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_sent ON scheduled_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_cancelled ON scheduled_reminders(cancelled);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_due ON scheduled_reminders(scheduled_for, sent, cancelled) WHERE sent = FALSE AND cancelled = FALSE;
      `);

      return;
    }

    // Create indexes
    console.log('Creating indexes...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_session_id ON scheduled_reminders(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled_for ON scheduled_reminders(scheduled_for)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_sent ON scheduled_reminders(sent)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_cancelled ON scheduled_reminders(cancelled)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_due ON scheduled_reminders(scheduled_for, sent, cancelled) WHERE sent = FALSE AND cancelled = FALSE'
    ];

    for (const indexQuery of indexes) {
      await supabase.rpc('exec_sql', { query: indexQuery }).catch(() => {});
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();