-- Create scheduled_reminders table for session reminders
CREATE TABLE IF NOT EXISTS scheduled_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'message')),
    recipient_id UUID NOT NULL,
    recipient_email VARCHAR(255),
    sender_id UUID, -- For message reminders (coach ID)
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    hours_before INTEGER NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    data JSONB NOT NULL, -- Store reminder data (names, emails, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_session_id ON scheduled_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled_for ON scheduled_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_sent ON scheduled_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_cancelled ON scheduled_reminders(cancelled);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_due ON scheduled_reminders(scheduled_for, sent, cancelled) WHERE sent = FALSE AND cancelled = FALSE;

-- Add RLS policies
ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all reminders
CREATE POLICY "Service role can manage scheduled_reminders" ON scheduled_reminders
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to view their own reminders
CREATE POLICY "Users can view own reminders" ON scheduled_reminders
    FOR SELECT USING (
        auth.uid() = recipient_id
        OR auth.uid() = sender_id
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_scheduled_reminders_updated_at
    BEFORE UPDATE ON scheduled_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_reminders_updated_at();