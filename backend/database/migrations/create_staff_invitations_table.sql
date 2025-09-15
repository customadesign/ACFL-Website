-- Create staff_invitations table for managing staff invitation workflow
CREATE TABLE IF NOT EXISTS staff_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Invitation details
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Staff role configuration
    department VARCHAR(100),
    role_level VARCHAR(50) DEFAULT 'staff', -- 'staff', 'supervisor', 'manager', 'admin'
    employment_type VARCHAR(50) DEFAULT 'full-time', -- 'full-time', 'part-time', 'contract', 'intern'

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
    responded_at TIMESTAMP WITH TIME ZONE,

    -- Additional invitation data
    message TEXT, -- Custom message from admin
    permissions JSONB, -- Specific permissions to grant

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    CONSTRAINT valid_role_level CHECK (role_level IN ('staff', 'supervisor', 'manager', 'admin')),
    CONSTRAINT valid_employment_type CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON staff_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON staff_invitations(status);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_expires_at ON staff_invitations(expires_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_invitations_updated_at
    BEFORE UPDATE ON staff_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_invitations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE staff_invitations IS 'Staff invitation management system';
COMMENT ON COLUMN staff_invitations.invitation_token IS 'Unique token for secure invitation acceptance';
COMMENT ON COLUMN staff_invitations.invited_by IS 'Admin user who sent the invitation';
COMMENT ON COLUMN staff_invitations.expires_at IS 'When the invitation expires';
COMMENT ON COLUMN staff_invitations.permissions IS 'JSON object containing specific permissions to grant';