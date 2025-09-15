-- Create staff table for admin staff members
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    -- Staff specific fields
    department VARCHAR(100), -- e.g., 'Administration', 'Support', 'Quality Assurance', 'Technical', 'Marketing', 'Finance'
    role_level VARCHAR(50) DEFAULT 'staff', -- 'staff', 'supervisor', 'manager', 'admin'
    employee_id VARCHAR(50) UNIQUE,
    hire_date DATE,

    -- Status and permissions
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    is_verified BOOLEAN DEFAULT false,

    -- Profile information
    profile_photo VARCHAR(500),
    bio TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),

    -- Employment details
    employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract', 'intern'
    salary_range VARCHAR(50),
    supervisor_id UUID REFERENCES staff(id),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,

    -- Additional metadata
    notes TEXT, -- Admin notes about the staff member
    skills TEXT[], -- Array of skills/competencies
    certifications TEXT[], -- Array of certifications

    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT valid_role_level CHECK (role_level IN ('staff', 'supervisor', 'manager', 'admin')),
    CONSTRAINT valid_employment_type CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern'))
);

-- Create staff_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS staff_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    capability_id VARCHAR(100) NOT NULL, -- e.g., 'users.view', 'appointments.edit', etc.
    granted BOOLEAN DEFAULT false,
    granted_by UUID REFERENCES staff(id), -- Who granted this permission
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(staff_id, capability_id)
);

-- Create staff_sessions table for session management
CREATE TABLE IF NOT EXISTS staff_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_audit_log table for tracking staff actions
CREATE TABLE IF NOT EXISTS staff_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'login', 'permission_granted', 'user_modified', etc.
    resource_type VARCHAR(50), -- e.g., 'user', 'appointment', 'content', etc.
    resource_id VARCHAR(100), -- ID of the resource being acted upon
    details JSONB, -- Additional details about the action
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_role_level ON staff(role_level);
CREATE INDEX IF NOT EXISTS idx_staff_created_at ON staff(created_at);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_staff_id ON staff_permissions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_capability ON staff_permissions(capability_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_granted ON staff_permissions(granted);

CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON staff_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires ON staff_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_staff_audit_staff_id ON staff_audit_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_action ON staff_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_staff_audit_resource ON staff_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_created_at ON staff_audit_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_updated_at();

CREATE TRIGGER staff_permissions_updated_at
    BEFORE UPDATE ON staff_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_updated_at();

CREATE TRIGGER staff_sessions_updated_at
    BEFORE UPDATE ON staff_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_updated_at();

-- Insert default admin staff member (optional - adjust as needed)
INSERT INTO staff (
    first_name,
    last_name,
    email,
    password_hash,
    department,
    role_level,
    employee_id,
    hire_date,
    status,
    is_verified,
    employment_type
) VALUES (
    'System',
    'Administrator',
    'admin@actcoachingforlife.com',
    '$2b$12$defaulthashedpassword', -- Replace with actual hashed password
    'Administration',
    'admin',
    'EMP-001',
    CURRENT_DATE,
    'active',
    true,
    'full-time'
) ON CONFLICT (email) DO NOTHING;

-- Insert default permissions for all capabilities (admin gets all permissions)
WITH admin_staff AS (
    SELECT id FROM staff WHERE email = 'admin@actcoachingforlife.com' LIMIT 1
),
capabilities AS (
    VALUES
    -- User Management
    ('users.view'),
    ('users.edit'),
    ('users.create'),
    ('users.delete'),
    ('users.status'),
    ('users.impersonate'),
    ('users.reset_password'),

    -- Appointment Management
    ('appointments.view'),
    ('appointments.edit'),
    ('appointments.status'),
    ('appointments.reschedule'),
    ('appointments.cancel'),
    ('appointments.notes'),

    -- Financial Management
    ('financial.view'),
    ('financial.stats'),
    ('financial.refund'),
    ('financial.export'),

    -- Content Management
    ('content.view'),
    ('content.edit'),
    ('content.publish'),
    ('content.create'),

    -- Message Center
    ('messages.view'),
    ('messages.send'),
    ('messages.moderate'),

    -- Analytics
    ('analytics.view'),
    ('analytics.export'),
    ('analytics.advanced')
)
INSERT INTO staff_permissions (staff_id, capability_id, granted, granted_by)
SELECT
    admin_staff.id,
    capabilities.column1,
    true,
    admin_staff.id
FROM admin_staff, capabilities
ON CONFLICT (staff_id, capability_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE staff IS 'Staff members who have access to admin functions';
COMMENT ON TABLE staff_permissions IS 'Granular permissions for staff members';
COMMENT ON TABLE staff_sessions IS 'Active sessions for staff members';
COMMENT ON TABLE staff_audit_log IS 'Audit trail of staff actions';

COMMENT ON COLUMN staff.department IS 'Department the staff member belongs to';
COMMENT ON COLUMN staff.role_level IS 'Hierarchical role level within the organization';
COMMENT ON COLUMN staff.employee_id IS 'Unique employee identifier';
COMMENT ON COLUMN staff.supervisor_id IS 'Reference to supervisor (self-referencing)';

COMMENT ON COLUMN staff_permissions.capability_id IS 'Dot-notation capability identifier (e.g., users.view)';
COMMENT ON COLUMN staff_permissions.granted IS 'Whether this permission is currently granted';
COMMENT ON COLUMN staff_permissions.expires_at IS 'Optional expiration date for temporary permissions';