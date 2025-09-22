-- Create account_deletions table for managing scheduled account deletions
CREATE TABLE IF NOT EXISTS account_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('client', 'coach')),
    deactivated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    scheduled_deletion_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_deletions_user_id ON account_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletions_scheduled_deletion_at ON account_deletions(scheduled_deletion_at);
CREATE INDEX IF NOT EXISTS idx_account_deletions_status ON account_deletions(status);

-- Add deactivated_at columns to existing tables if they don't exist
DO $$
BEGIN
    -- Add deactivated_at to clients table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'deactivated_at') THEN
        ALTER TABLE clients ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add is_active to clients table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'is_active') THEN
        ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add deactivated_at to coaches table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'coaches' AND column_name = 'deactivated_at') THEN
        ALTER TABLE coaches ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add is_active to coaches table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'coaches' AND column_name = 'is_active') THEN
        ALTER TABLE coaches ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create function to add user to hidden array (for messages)
CREATE OR REPLACE FUNCTION add_user_to_hidden_array(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET hidden_for_users = COALESCE(hidden_for_users, '{}') || ARRAY[user_id]
    WHERE id = message_id
    AND NOT (hidden_for_users @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql;

-- Create function to append hidden user (for conversations)
CREATE OR REPLACE FUNCTION append_hidden_user(user_id UUID, partner_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET hidden_for_users = COALESCE(hidden_for_users, '{}') || ARRAY[user_id]
    WHERE (sender_id = user_id AND recipient_id = partner_id)
       OR (sender_id = partner_id AND recipient_id = user_id)
    AND NOT (hidden_for_users @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql;