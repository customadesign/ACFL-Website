-- Create admin_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'login', 'user_suspended', 'appointment_created', etc.
    resource_type VARCHAR(50), -- e.g., 'user', 'appointment', 'payment', 'coach', 'client', etc.
    resource_id VARCHAR(100), -- ID of the resource being acted upon
    details TEXT, -- Human-readable description of the action
    metadata JSONB, -- Additional structured data about the action
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create client_audit_log table for tracking client actions
CREATE TABLE IF NOT EXISTS client_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'login', 'appointment_booked', 'payment_made', etc.
    resource_type VARCHAR(50), -- e.g., 'appointment', 'payment', 'profile', etc.
    resource_id VARCHAR(100), -- ID of the resource being acted upon
    details TEXT, -- Human-readable description of the action
    metadata JSONB, -- Additional structured data about the action
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create coach_audit_log table for tracking coach actions
CREATE TABLE IF NOT EXISTS coach_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'login', 'appointment_completed', 'schedule_updated', etc.
    resource_type VARCHAR(50), -- e.g., 'appointment', 'schedule', 'profile', etc.
    resource_id VARCHAR(100), -- ID of the resource being acted upon
    details TEXT, -- Human-readable description of the action
    metadata JSONB, -- Additional structured data about the action
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create session_audit_log table for tracking session-related actions
CREATE TABLE IF NOT EXISTS session_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    user_id UUID, -- ID of the user who performed the action
    user_type VARCHAR(20), -- 'admin', 'staff', 'coach', 'client'
    action VARCHAR(100) NOT NULL, -- e.g., 'created', 'updated', 'cancelled', 'completed', etc.
    old_values JSONB, -- Previous values before change
    new_values JSONB, -- New values after change
    details TEXT, -- Human-readable description of the action
    metadata JSONB, -- Additional structured data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_client_audit_client_id ON client_audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_audit_action ON client_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_client_audit_resource ON client_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_client_audit_created_at ON client_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_coach_audit_coach_id ON coach_audit_log(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_audit_action ON coach_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_coach_audit_resource ON coach_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_coach_audit_created_at ON coach_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_session_audit_session_id ON session_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_session_audit_user ON session_audit_log(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_session_audit_action ON session_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_session_audit_created_at ON session_audit_log(created_at);

-- Add comments
COMMENT ON TABLE admin_audit_log IS 'Audit trail of admin actions';
COMMENT ON TABLE client_audit_log IS 'Audit trail of client actions';
COMMENT ON TABLE coach_audit_log IS 'Audit trail of coach actions';
COMMENT ON TABLE session_audit_log IS 'Audit trail of session-related actions';

COMMENT ON COLUMN admin_audit_log.action IS 'Type of action performed (login, user_suspended, etc.)';
COMMENT ON COLUMN admin_audit_log.resource_type IS 'Type of resource affected (user, appointment, payment, etc.)';
COMMENT ON COLUMN admin_audit_log.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN admin_audit_log.details IS 'Human-readable description of what happened';
COMMENT ON COLUMN admin_audit_log.metadata IS 'Additional structured data about the action';

COMMENT ON COLUMN session_audit_log.old_values IS 'Previous values before the change';
COMMENT ON COLUMN session_audit_log.new_values IS 'New values after the change';