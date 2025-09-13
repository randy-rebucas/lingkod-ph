-- LocalPro Service Marketplace - Sample Data
-- This file contains sample data to demonstrate the schema functionality

-- Insert sample categories
INSERT INTO categories (id, name, description, icon, is_active, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'House Cleaning', 'Professional house cleaning services', 'broom', true, 1),
('550e8400-e29b-41d4-a716-446655440002', 'Plumbing', 'Plumbing repair and installation services', 'wrench', true, 2),
('550e8400-e29b-41d4-a716-446655440003', 'Electrical', 'Electrical work and repairs', 'lightbulb', true, 3),
('550e8400-e29b-41d4-a716-446655440004', 'Gardening', 'Landscaping and garden maintenance', 'tree', true, 4),
('550e8400-e29b-41d4-a716-446655440005', 'Carpentry', 'Woodwork and furniture repair', 'hammer', true, 5);

-- Insert sample users
INSERT INTO users (uid, email, display_name, phone, role, account_status, photo_url, bio, address, is_verified, loyalty_points, referral_code) VALUES
-- Admin user
('550e8400-e29b-41d4-a716-446655440010', 'admin@localpro.ph', 'LocalPro Admin', '+639171234567', 'admin', 'active', 'https://example.com/admin.jpg', 'Platform administrator', 'Manila, Philippines', true, 0, 'ADMIN001'),

-- Agency users
('550e8400-e29b-41d4-a716-446655440011', 'cleanpro@agency.ph', 'CleanPro Agency', '+639172345678', 'agency', 'active', 'https://example.com/cleanpro.jpg', 'Professional cleaning services agency', 'Quezon City, Philippines', true, 0, 'AGENCY001'),
('550e8400-e29b-41d4-a716-446655440012', 'homefix@agency.ph', 'HomeFix Solutions', '+639173456789', 'agency', 'active', 'https://example.com/homefix.jpg', 'Complete home repair solutions', 'Makati, Philippines', true, 0, 'AGENCY002'),

-- Provider users (independent)
('550e8400-e29b-41d4-a716-446655440013', 'maria.cleaner@email.com', 'Maria Santos', '+639174567890', 'provider', 'active', 'https://example.com/maria.jpg', 'Professional house cleaner with 5 years experience', 'Taguig, Philippines', true, 150, 'PROV001'),
('550e8400-e29b-41d4-a716-446655440014', 'juan.plumber@email.com', 'Juan Dela Cruz', '+639175678901', 'provider', 'active', 'https://example.com/juan.jpg', 'Licensed plumber specializing in residential repairs', 'Pasig, Philippines', true, 200, 'PROV002'),
('550e8400-e29b-41d4-a716-446655440015', 'ana.electrician@email.com', 'Ana Rodriguez', '+639176789012', 'provider', 'active', 'https://example.com/ana.jpg', 'Certified electrician for all electrical needs', 'Marikina, Philippines', true, 75, 'PROV003'),

-- Provider users (under agencies)
('550e8400-e29b-41d4-a716-446655440016', 'pedro.cleaner@email.com', 'Pedro Martinez', '+639177890123', 'provider', 'active', 'https://example.com/pedro.jpg', 'Experienced cleaner from CleanPro Agency', 'Quezon City, Philippines', true, 100, 'PROV004'),
('550e8400-e29b-41d4-a716-446655440017', 'luz.plumber@email.com', 'Luz Garcia', '+639178901234', 'provider', 'active', 'https://example.com/luz.jpg', 'Skilled plumber from HomeFix Solutions', 'Makati, Philippines', true, 125, 'PROV005'),

-- Client users
('550e8400-e29b-41d4-a716-446655440018', 'client1@email.com', 'Sarah Johnson', '+639179012345', 'client', 'active', 'https://example.com/sarah.jpg', 'Homeowner looking for reliable services', 'BGC, Philippines', true, 50, 'CLIENT001'),
('550e8400-e29b-41d4-a716-446655440019', 'client2@email.com', 'Michael Chen', '+639170123456', 'client', 'active', 'https://example.com/michael.jpg', 'Business owner needing regular maintenance', 'Ortigas, Philippines', true, 25, 'CLIENT002'),
('550e8400-e29b-41d4-a716-446655440020', 'client3@email.com', 'Lisa Santos', '+639171234567', 'client', 'active', 'https://example.com/lisa.jpg', 'Apartment dweller seeking cleaning services', 'Mandaluyong, Philippines', true, 75, 'CLIENT003');

-- Update agency relationships
UPDATE users SET agency_id = '550e8400-e29b-41d4-a716-446655440011' WHERE uid = '550e8400-e29b-41d4-a716-446655440016';
UPDATE users SET agency_id = '550e8400-e29b-41d4-a716-446655440012' WHERE uid = '550e8400-e29b-41d4-a716-446655440017';

-- Insert user availability schedules
INSERT INTO user_availability (user_id, day_of_week, enabled, start_time, end_time) VALUES
-- Maria's availability (Monday to Friday, 8 AM to 6 PM)
('550e8400-e29b-41d4-a716-446655440013', 1, true, '08:00:00', '18:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 2, true, '08:00:00', '18:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 3, true, '08:00:00', '18:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 4, true, '08:00:00', '18:00:00'),
('550e8400-e29b-41d4-a716-446655440013', 5, true, '08:00:00', '18:00:00'),

-- Juan's availability (Monday to Saturday, 7 AM to 7 PM)
('550e8400-e29b-41d4-a716-446655440014', 1, true, '07:00:00', '19:00:00'),
('550e8400-e29b-41d4-a716-446655440014', 2, true, '07:00:00', '19:00:00'),
('550e8400-e29b-41d4-a716-446655440014', 3, true, '07:00:00', '19:00:00'),
('550e8400-e29b-41d4-a716-446655440014', 4, true, '07:00:00', '19:00:00'),
('550e8400-e29b-41d4-a716-446655440014', 5, true, '07:00:00', '19:00:00'),
('550e8400-e29b-41d4-a716-446655440014', 6, true, '07:00:00', '19:00:00');

-- Insert sample services
INSERT INTO services (id, user_id, name, category_id, price, description, status) VALUES
-- Maria's cleaning services
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 'Regular House Cleaning', '550e8400-e29b-41d4-a716-446655440001', 800.00, 'Complete house cleaning including kitchen, bathroom, living areas', 'Active'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440013', 'Deep Cleaning Service', '550e8400-e29b-41d4-a716-446655440001', 1200.00, 'Thorough deep cleaning with special attention to hard-to-reach areas', 'Active'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 'Kitchen Deep Clean', '550e8400-e29b-41d4-a716-446655440001', 500.00, 'Specialized kitchen cleaning including appliances and cabinets', 'Active'),

-- Juan's plumbing services
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'Pipe Repair', '550e8400-e29b-41d4-a716-446655440002', 600.00, 'Repair of leaking or damaged pipes', 'Active'),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', 'Faucet Installation', '550e8400-e29b-41d4-a716-446655440002', 400.00, 'Installation of new faucets and fixtures', 'Active'),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440014', 'Drain Cleaning', '550e8400-e29b-41d4-a716-446655440002', 300.00, 'Unclogging and cleaning of drains', 'Active'),

-- Ana's electrical services
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440015', 'Electrical Wiring', '550e8400-e29b-41d4-a716-446655440003', 800.00, 'New electrical wiring installation', 'Active'),
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440015', 'Light Fixture Installation', '550e8400-e29b-41d4-a716-446655440003', 350.00, 'Installation of light fixtures and switches', 'Active');

-- Insert sample jobs
INSERT INTO jobs (id, title, description, category_id, category_name, budget_amount, budget_type, is_negotiable, location, client_id, client_name, client_is_verified, status, deadline) VALUES
-- Sarah's cleaning job
('550e8400-e29b-41d4-a716-446655440031', 'Need Regular House Cleaning Service', 'Looking for a reliable house cleaner for my 3-bedroom apartment. Need weekly cleaning service including kitchen, bathrooms, and living areas.', '550e8400-e29b-41d4-a716-446655440001', 'House Cleaning', 1000.00, 'Fixed', true, 'BGC, Taguig City', '550e8400-e29b-41d4-a716-446655440018', 'Sarah Johnson', true, 'Open', '2024-02-15 00:00:00+08'),

-- Michael's plumbing job
('550e8400-e29b-41d4-a716-446655440032', 'Urgent: Leaking Kitchen Sink', 'Kitchen sink is leaking and needs immediate repair. Looking for experienced plumber who can come today or tomorrow.', '550e8400-e29b-41d4-a716-446655440002', 'Plumbing', 500.00, 'Fixed', false, 'Ortigas Center, Pasig City', '550e8400-e29b-41d4-a716-446655440019', 'Michael Chen', true, 'Open', '2024-02-10 00:00:00+08'),

-- Lisa's electrical job
('550e8400-e29b-41d4-a716-446655440033', 'Install New Ceiling Fan', 'Need to install a new ceiling fan in my living room. Looking for certified electrician with experience in fan installation.', '550e8400-e29b-41d4-a716-446655440003', 'Electrical', 600.00, 'Fixed', true, 'Mandaluyong City', '550e8400-e29b-41d4-a716-446655440020', 'Lisa Santos', true, 'Open', '2024-02-20 00:00:00+08');

-- Insert job applications
INSERT INTO job_applications (id, job_id, provider_id, status) VALUES
-- Maria applies to Sarah's cleaning job
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440013', 'Pending'),

-- Juan applies to Michael's plumbing job
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440014', 'Pending'),

-- Ana applies to Lisa's electrical job
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440015', 'Pending');

-- Insert sample bookings
INSERT INTO bookings (id, service_id, service_name, client_id, provider_id, client_name, provider_name, date, status, price, notes) VALUES
-- Completed booking with review
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440021', 'Regular House Cleaning', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440013', 'Sarah Johnson', 'Maria Santos', '2024-01-15 09:00:00+08', 'Completed', 800.00, 'Excellent service, very thorough cleaning'),

-- Upcoming booking
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440024', 'Pipe Repair', '550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440014', 'Michael Chen', 'Juan Dela Cruz', '2024-02-08 14:00:00+08', 'Upcoming', 600.00, 'Kitchen sink repair needed'),

-- Pending payment booking
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440028', 'Light Fixture Installation', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440015', 'Lisa Santos', 'Ana Rodriguez', '2024-02-12 10:00:00+08', 'Pending Payment', 350.00, 'Ceiling fan installation');

-- Insert sample reviews
INSERT INTO reviews (id, provider_id, client_id, client_name, client_avatar, booking_id, rating, comment) VALUES
-- Review for Maria's cleaning service
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440018', 'Sarah Johnson', 'https://example.com/sarah.jpg', '550e8400-e29b-41d4-a716-446655440051', 5, 'Maria did an excellent job cleaning my apartment. She was very thorough and professional. Highly recommended!'),

-- Review for Juan's plumbing service
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440019', 'Michael Chen', 'https://example.com/michael.jpg', '550e8400-e29b-41d4-a716-446655440051', 4, 'Juan fixed my plumbing issue quickly and efficiently. Good work and fair pricing.');

-- Insert sample conversations
INSERT INTO conversations (id, participants, participant_info, last_message, timestamp) VALUES
-- Conversation between Sarah and Maria
('550e8400-e29b-41d4-a716-446655440071', ARRAY['550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440013'], 
'{"550e8400-e29b-41d4-a716-446655440018": {"displayName": "Sarah Johnson", "photoURL": "https://example.com/sarah.jpg"}, "550e8400-e29b-41d4-a716-446655440013": {"displayName": "Maria Santos", "photoURL": "https://example.com/maria.jpg"}}',
'Thank you for the excellent cleaning service!', '2024-01-15 18:00:00+08'),

-- Conversation between Michael and Juan
('550e8400-e29b-41d4-a716-446655440072', ARRAY['550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440014'],
'{"550e8400-e29b-41d4-a716-446655440019": {"displayName": "Michael Chen", "photoURL": "https://example.com/michael.jpg"}, "550e8400-e29b-41d4-a716-446655440014": {"displayName": "Juan Dela Cruz", "photoURL": "https://example.com/juan.jpg"}}',
'What time will you arrive tomorrow?', '2024-02-07 16:30:00+08');

-- Insert sample messages
INSERT INTO messages (id, conversation_id, sender_id, text, created_at) VALUES
-- Messages in Sarah-Maria conversation
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440018', 'Hi Maria, I need house cleaning service for my apartment', '2024-01-14 10:00:00+08'),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440013', 'Hello Sarah! I would be happy to help. What size is your apartment?', '2024-01-14 10:05:00+08'),
('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440018', 'It\'s a 3-bedroom apartment, about 80 sqm', '2024-01-14 10:10:00+08'),
('550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440013', 'Perfect! I can do it for ₱800. When would you like me to come?', '2024-01-14 10:15:00+08'),
('550e8400-e29b-41d4-a716-446655440085', '550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440018', 'Thank you for the excellent cleaning service!', '2024-01-15 18:00:00+08');

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, message, link, read) VALUES
-- Notification for Maria about new review
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440013', 'new_review', 'Sarah Johnson left you a 5-star review for "Regular House Cleaning"', '/providers/550e8400-e29b-41d4-a716-446655440013', false),

-- Notification for Juan about new job
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440014', 'new_job', 'New plumbing job available: "Urgent: Leaking Kitchen Sink"', '/jobs/550e8400-e29b-41d4-a716-446655440032', false),

-- Notification for Sarah about booking completion
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440018', 'booking_update', 'Your booking with Maria Santos has been completed', '/bookings/550e8400-e29b-41d4-a716-446655440051', false);

-- Insert sample subscription plans
INSERT INTO subscriptions (id, name, price, ideal_for, features, badge, is_featured, type, sort_order) VALUES
-- Provider plans
('550e8400-e29b-41d4-a716-446655440101', 'Starter Provider', 299.00, 'New service providers', ARRAY['Basic profile', 'Service listings', 'Client messaging', 'Booking management'], NULL, false, 'provider', 1),
('550e8400-e29b-41d4-a716-446655440102', 'Professional Provider', 599.00, 'Established providers', ARRAY['All Starter features', 'Priority listing', 'Analytics dashboard', 'Advanced scheduling', 'Custom branding'], 'Most Popular', true, 'provider', 2),
('550e8400-e29b-41d4-a716-446655440103', 'Elite Provider', 999.00, 'Premium providers', ARRAY['All Professional features', 'AI-powered matching', 'Premium support', 'Advanced marketing tools', 'Revenue optimization'], 'Best Value', false, 'provider', 3),

-- Agency plans
('550e8400-e29b-41d4-a716-446655440104', 'Agency Starter', 999.00, 'Small agencies', ARRAY['Team management', 'Provider onboarding', 'Basic reporting', 'Client management'], NULL, false, 'agency', 1),
('550e8400-e29b-41d4-a716-446655440105', 'Agency Pro', 1999.00, 'Growing agencies', ARRAY['All Starter features', 'Advanced analytics', 'Custom workflows', 'API access', 'Priority support'], 'Most Popular', true, 'agency', 2);

-- Insert sample user subscriptions
INSERT INTO user_subscriptions (id, user_id, plan_id, status, renews_on, paypal_order_id) VALUES
-- Maria has Professional Provider plan
('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440102', 'active', '2024-03-01 00:00:00+08', 'PAYPAL-ORDER-001'),

-- Juan has Starter Provider plan
('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440101', 'active', '2024-03-01 00:00:00+08', 'PAYPAL-ORDER-002'),

-- CleanPro Agency has Agency Pro plan
('550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440105', 'active', '2024-03-01 00:00:00+08', 'PAYPAL-ORDER-003');

-- Insert sample transactions
INSERT INTO transactions (id, user_id, plan_id, amount, payment_method, status, paypal_order_id, payer_email) VALUES
-- Maria's subscription payment
('550e8400-e29b-41d4-a716-446655440121', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440102', 599.00, 'PayPal', 'completed', 'PAYPAL-ORDER-001', 'maria.cleaner@email.com'),

-- Juan's subscription payment
('550e8400-e29b-41d4-a716-446655440122', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440101', 299.00, 'PayPal', 'completed', 'PAYPAL-ORDER-002', 'juan.plumber@email.com'),

-- CleanPro Agency's subscription payment
('550e8400-e29b-41d4-a716-446655440123', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440105', 1999.00, 'PayPal', 'completed', 'PAYPAL-ORDER-003', 'cleanpro@agency.ph');

-- Insert sample loyalty rewards
INSERT INTO loyalty_rewards (id, title, description, points_required, type, value, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440131', '₱50 Discount', 'Get a ₱50 discount on your next booking', 500, 'discount', 50.00, true),
('550e8400-e29b-41d4-a716-446655440132', '₱100 Discount', 'Get a ₱100 discount on your next booking', 950, 'discount', 100.00, true),
('550e8400-e29b-41d4-a716-446655440133', 'Free Basic Cleaning Service', 'Redeem for a free basic cleaning service (up to ₱500 value)', 4500, 'free_service', 500.00, true),
('550e8400-e29b-41d4-a716-446655440134', '10% Off Any Service', 'Get 10% off any single service booking', 1500, 'percentage_discount', 10.00, true);

-- Insert sample loyalty transactions
INSERT INTO loyalty_transactions (id, user_id, points, type, description, booking_id) VALUES
-- Sarah earned points from completed booking
('550e8400-e29b-41d4-a716-446655440141', '550e8400-e29b-41d4-a716-446655440018', 80, 'earn', 'Points for completing service: Regular House Cleaning', '550e8400-e29b-41d4-a716-446655440051'),

-- Michael earned points from completed booking
('550e8400-e29b-41d4-a716-446655440142', '550e8400-e29b-41d4-a716-446655440019', 60, 'earn', 'Points for completing service: Pipe Repair', '550e8400-e29b-41d4-a716-446655440051');

-- Insert sample referrals
INSERT INTO referrals (id, referrer_id, referred_id, referred_email, reward_points_granted) VALUES
-- Sarah referred Lisa
('550e8400-e29b-41d4-a716-446655440151', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440020', 'client3@email.com', 100);

-- Insert sample favorites
INSERT INTO favorites (id, user_id, provider_id) VALUES
-- Sarah saved Maria as favorite
('550e8400-e29b-41d4-a716-446655440161', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440013'),

-- Michael saved Juan as favorite
('550e8400-e29b-41d4-a716-446655440162', '550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440014');

-- Insert sample payouts
INSERT INTO payouts (id, transaction_id, provider_id, provider_name, agency_id, amount, payout_details, status, requested_at) VALUES
-- Maria's pending payout
('550e8400-e29b-41d4-a716-446655440171', 'PAYOUT-20240201-001', '550e8400-e29b-41d4-a716-446655440013', 'Maria Santos', NULL, 800.00, '{"method": "gcash", "gCashNumber": "0917-123-4567"}', 'Pending', '2024-02-01 10:00:00+08'),

-- Pedro's payout (under agency)
('550e8400-e29b-41d4-a716-446655440172', 'PAYOUT-20240201-002', '550e8400-e29b-41d4-a716-446655440016', 'Pedro Martinez', '550e8400-e29b-41d4-a716-446655440011', 600.00, '{"method": "bank", "bankName": "BDO", "bankAccountNumber": "1234567890", "bankAccountName": "Pedro Martinez"}', 'Pending', '2024-02-01 11:00:00+08');

-- Insert sample audit logs
INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, details) VALUES
-- Admin action
('550e8400-e29b-41d4-a716-446655440181', '550e8400-e29b-41d4-a716-446655440010', 'LocalPro Admin', 'admin', 'USER_STATUS_UPDATED', '{"userId": "550e8400-e29b-41d4-a716-446655440013", "oldStatus": "pending_approval", "newStatus": "active"}'),

-- Provider action
('550e8400-e29b-41d4-a716-446655440182', '550e8400-e29b-41d4-a716-446655440013', 'Maria Santos', 'provider', 'SERVICE_CREATED', '{"serviceId": "550e8400-e29b-41d4-a716-446655440021", "serviceName": "Regular House Cleaning"}');

-- Insert sample platform settings
INSERT INTO platform_settings (id, setting_key, setting_value) VALUES
('550e8400-e29b-41d4-a716-446655440191', 'commission_rate', '{"low_ticket": 5, "mid_ticket": 7, "high_ticket": 10}'),
('550e8400-e29b-41d4-a716-446655440192', 'loyalty_points_rate', '{"points_per_peso": 0.1}'),
('550e8400-e29b-41d4-a716-446655440193', 'referral_bonus', '{"referrer_points": 100, "referred_points": 100}');

-- Insert sample ad campaigns
INSERT INTO ad_campaigns (id, title, description, image_url, link_url, is_active, start_date, end_date) VALUES
('550e8400-e29b-41d4-a716-446655440201', 'Spring Cleaning Special', 'Get 20% off all cleaning services this spring!', 'https://example.com/spring-cleaning-ad.jpg', '/jobs?category=cleaning', true, '2024-02-01 00:00:00+08', '2024-03-31 23:59:59+08'),
('550e8400-e29b-41d4-a716-446655440202', 'New Provider Signup Bonus', 'Join as a provider and get your first month free!', 'https://example.com/provider-signup-ad.jpg', '/subscription', true, '2024-01-01 00:00:00+08', '2024-12-31 23:59:59+08');

-- Insert sample broadcasts
INSERT INTO broadcasts (id, title, message, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440211', 'System Maintenance', 'We will be performing system maintenance on February 15th from 2-4 AM. Services may be temporarily unavailable.', true),
('550e8400-e29b-41d4-a716-446655440212', 'New Features Available', 'Check out our new AI-powered service matching feature! Get better recommendations for your needs.', true);

-- Insert sample support tickets
INSERT INTO tickets (id, user_id, subject, message, status, priority) VALUES
('550e8400-e29b-41d4-a716-446655440221', '550e8400-e29b-41d4-a716-446655440018', 'Payment Issue', 'I tried to pay for a service but the payment failed. Can you help me resolve this?', 'Open', 'Medium'),
('550e8400-e29b-41d4-a716-446655440222', '550e8400-e29b-41d4-a716-446655440013', 'Account Verification', 'I submitted my documents for verification but haven\'t heard back yet.', 'In Progress', 'Low');

-- Insert sample backups
INSERT INTO backups (id, file_name, file_path, download_url, collections, document_count) VALUES
('550e8400-e29b-41d4-a716-446655440231', 'backup-2024-02-01T10-00-00.json', 'backups/backup-2024-02-01T10-00-00.json', 'https://storage.googleapis.com/localpro-backups/backup-2024-02-01T10-00-00.json', ARRAY['users', 'services', 'jobs', 'bookings', 'reviews'], 150);

COMMIT;
