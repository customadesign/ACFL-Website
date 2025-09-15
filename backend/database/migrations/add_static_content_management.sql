-- Create static_content table for managing FAQ, Terms of Service, etc.
CREATE TABLE IF NOT EXISTS static_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'faq', 'terms', 'privacy', 'about', etc.
    is_published BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES admins(id),
    updated_by UUID REFERENCES admins(id)
);

-- Create FAQ categories table
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create FAQ items table
CREATE TABLE IF NOT EXISTS faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES faq_categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES admins(id),
    updated_by UUID REFERENCES admins(id)
);

-- Create payment_transactions table for financial oversight
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    client_id UUID REFERENCES clients(id),
    coach_id UUID REFERENCES coaches(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'stripe', 'paypal', etc.
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial_reports table for admin insights
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_revenue DECIMAL(10, 2),
    total_transactions INTEGER,
    successful_transactions INTEGER,
    failed_transactions INTEGER,
    refunded_amount DECIMAL(10, 2),
    platform_fees DECIMAL(10, 2),
    coach_payouts DECIMAL(10, 2),
    report_data JSONB,
    generated_by UUID REFERENCES admins(id),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_static_content_slug ON static_content(slug);
CREATE INDEX idx_static_content_type ON static_content(content_type);
CREATE INDEX idx_static_content_published ON static_content(is_published);

CREATE INDEX idx_faq_items_category ON faq_items(category_id);
CREATE INDEX idx_faq_items_published ON faq_items(is_published);

CREATE INDEX idx_payment_transactions_client ON payment_transactions(client_id);
CREATE INDEX idx_payment_transactions_coach ON payment_transactions(coach_id);
CREATE INDEX idx_payment_transactions_session ON payment_transactions(session_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(created_at);

-- Add RLS policies
ALTER TABLE static_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Public can read published content
CREATE POLICY "Public can read published static content" ON static_content
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read active FAQ categories" ON faq_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read published FAQ items" ON faq_items
    FOR SELECT USING (is_published = true);

-- Admins have full access
CREATE POLICY "Admins can manage static content" ON static_content
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage FAQ categories" ON faq_categories
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage FAQ items" ON faq_items
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all payment transactions" ON payment_transactions
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage financial reports" ON financial_reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Clients and coaches can view their own transactions
CREATE POLICY "Clients can view their transactions" ON payment_transactions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'client' AND 
        client_id::text = auth.jwt() ->> 'userId'
    );

CREATE POLICY "Coaches can view their transactions" ON payment_transactions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'coach' AND 
        coach_id::text = auth.jwt() ->> 'userId'
    );