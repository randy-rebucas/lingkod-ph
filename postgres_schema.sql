-- LocalPro Service Marketplace PostgreSQL Schema
-- This schema represents a service marketplace platform connecting clients with service providers

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (main user accounts)
CREATE TABLE users (
    uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'provider', 'agency', 'admin', 'partner')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'pending_approval', 'suspended')),
    photo_url TEXT,
    bio TEXT,
    address TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    loyalty_points INTEGER DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(uid),
    agency_id UUID REFERENCES users(uid), -- For providers under agencies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User availability schedule
CREATE TABLE user_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    enabled BOOLEAN DEFAULT TRUE,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User documents (for verification)
CREATE TABLE user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories for services and jobs
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services offered by providers
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs posted by clients
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    category_name VARCHAR(255) NOT NULL,
    budget_amount DECIMAL(10,2) NOT NULL,
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('Fixed', 'Daily', 'Monthly')),
    is_negotiable BOOLEAN DEFAULT FALSE,
    location VARCHAR(255) NOT NULL,
    client_id UUID NOT NULL REFERENCES users(uid),
    client_name VARCHAR(255) NOT NULL,
    client_is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Closed')),
    deadline TIMESTAMP WITH TIME ZONE,
    additional_details JSONB, -- For custom questions and answers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job applications (providers applying to jobs)
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(uid),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings (confirmed service appointments)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id),
    service_id UUID REFERENCES services(id),
    service_name VARCHAR(255) NOT NULL,
    client_id UUID NOT NULL REFERENCES users(uid),
    provider_id UUID NOT NULL REFERENCES users(uid),
    client_name VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending Payment' CHECK (status IN ('Pending Payment', 'Pending Verification', 'Upcoming', 'In Progress', 'Completed', 'Cancelled')),
    price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    completion_photo_url TEXT,
    payment_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES users(uid),
    client_id UUID NOT NULL REFERENCES users(uid),
    client_name VARCHAR(255) NOT NULL,
    client_avatar TEXT,
    booking_id UUID REFERENCES bookings(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations between users
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL, -- Array of user IDs
    participant_info JSONB NOT NULL, -- Store display names and avatars
    last_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages within conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(uid),
    text TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('booking_update', 'new_message', 'agency_invite', 'info', 'renewal_reminder', 'new_review', 'new_job')),
    message TEXT NOT NULL,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    ideal_for TEXT,
    features TEXT[],
    badge VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('provider', 'agency')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User subscription status
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid),
    plan_id UUID NOT NULL REFERENCES subscriptions(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'pending', 'cancelled', 'expired')),
    renews_on TIMESTAMP WITH TIME ZONE,
    paypal_order_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid),
    plan_id UUID NOT NULL REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    paypal_order_id VARCHAR(255),
    payer_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    provider_id UUID NOT NULL REFERENCES users(uid),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_address TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice line items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quotes
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(100) NOT NULL UNIQUE,
    provider_id UUID NOT NULL REFERENCES users(uid),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_address TEXT NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quote line items
CREATE TABLE quote_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payout requests
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(100) UNIQUE,
    provider_id UUID NOT NULL REFERENCES users(uid),
    provider_name VARCHAR(255) NOT NULL,
    agency_id UUID REFERENCES users(uid),
    amount DECIMAL(10,2) NOT NULL,
    payout_details JSONB NOT NULL, -- Store GCash/bank details
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Loyalty rewards
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('discount', 'free_service', 'percentage_discount')),
    value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty transactions
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'redeem', 'referral')),
    description TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    reward_id UUID REFERENCES loyalty_rewards(id),
    referred_user_id UUID REFERENCES users(uid),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Referrals
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(uid),
    referred_id UUID NOT NULL REFERENCES users(uid),
    referred_email VARCHAR(255) NOT NULL,
    reward_points_granted INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agency invites
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES users(uid),
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User favorites (providers saved by clients)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider_id)
);

-- Reports (for moderation)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(uid),
    reported_user_id UUID REFERENCES users(uid),
    reported_job_id UUID REFERENCES jobs(id),
    report_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad campaigns
CREATE TABLE ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Broadcast messages
CREATE TABLE broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(uid),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES users(uid),
    actor_name VARCHAR(255),
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Backups
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    download_url TEXT,
    collections TEXT[] NOT NULL,
    document_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform settings
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category_id ON jobs(category_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_provider_id ON job_applications(provider_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX idx_quotes_provider_id ON quotes(provider_id);
CREATE INDEX idx_payouts_provider_id ON payouts(provider_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_provider_id ON favorites(provider_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Main user accounts for the LocalPro platform';
COMMENT ON TABLE services IS 'Services offered by providers';
COMMENT ON TABLE jobs IS 'Job postings by clients';
COMMENT ON TABLE bookings IS 'Confirmed service appointments';
COMMENT ON TABLE reviews IS 'Client reviews and ratings for providers';
COMMENT ON TABLE conversations IS 'Chat conversations between users';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE notifications IS 'User notifications for various events';
COMMENT ON TABLE subscriptions IS 'Subscription plans available to users';
COMMENT ON TABLE transactions IS 'Payment transactions for subscriptions';
COMMENT ON TABLE invoices IS 'Invoices generated by providers';
COMMENT ON TABLE quotes IS 'Quotes generated by providers';
COMMENT ON TABLE payouts IS 'Payout requests from providers';
COMMENT ON TABLE loyalty_rewards IS 'Available loyalty rewards';
COMMENT ON TABLE loyalty_transactions IS 'Loyalty point transactions';
COMMENT ON TABLE referrals IS 'User referral tracking';
COMMENT ON TABLE favorites IS 'Client saved providers';
COMMENT ON TABLE reports IS 'User reports for moderation';
COMMENT ON TABLE audit_logs IS 'System audit trail';
