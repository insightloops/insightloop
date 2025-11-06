-- Seed data for development
-- Insert sample company
INSERT INTO companies (id, name, slug, industry, size) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Company', 'demo-company', 'SaaS', 'startup');

-- Insert sample products
INSERT INTO products (id, company_id, name, description, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Platform', 'Core SaaS platform', '{"type": "web_platform", "area": "frontend"}'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Mobile App', 'iOS and Android app', '{"type": "mobile_app", "area": "mobile"}');

-- Insert sample objectives
INSERT INTO objectives (id, company_id, title, description, target_value, current_value, quarter, year) VALUES 
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Increase User Activation', 'Improve onboarding completion rate', 80.0, 65.0, 'Q4', 2024),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Reduce Churn Rate', 'Decrease monthly churn below 5%', 5.0, 7.2, 'Q4', 2024);

-- Create product areas for Main Platform
INSERT INTO product_areas (id, product_id, name, description, keywords) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Onboarding', 'User signup and initial setup', ARRAY['signup', 'registration', 'welcome', 'onboarding', 'getting started']),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'Dashboard', 'Main user interface and analytics', ARRAY['dashboard', 'analytics', 'overview', 'home', 'main']),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'Settings', 'Account and preferences management', ARRAY['settings', 'preferences', 'account', 'profile', 'configuration']),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001', 'Billing', 'Payment and subscription management', ARRAY['billing', 'payment', 'subscription', 'invoice', 'pricing']);

-- Create product areas for Mobile App
INSERT INTO product_areas (id, product_id, name, description, keywords) VALUES 
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'Core Features', 'Main mobile app functionality', ARRAY['mobile', 'app', 'core', 'features']),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 'File Upload', 'Mobile file upload and management', ARRAY['upload', 'files', 'media', 'attachments']),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440002', 'Notifications', 'Push notifications and alerts', ARRAY['notifications', 'push', 'alerts', 'messages']);

-- Insert sample features with product areas (using new schema)
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'Simplified Onboarding', 'Streamline the user onboarding process', 'planned', 'high', 8, 9, '{"team": "frontend"}'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', 'Dashboard Redesign', 'Improve dashboard UX and clarity', 'in_progress', 'medium', 6, 7, '{"team": "frontend"}');

-- Insert sample feedback
INSERT INTO feedback_items (id, company_id, source, content, sentiment, product_area, user_metadata, submitted_at) VALUES 
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 'csv', 'The onboarding process is too long and confusing. I almost gave up halfway through.', 'negative', 'onboarding', '{"user_type": "trial", "plan": "free", "company_size": "small"}', '2024-10-25 10:00:00+00'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', 'csv', 'Love the new dashboard! Much cleaner than before.', 'positive', 'dashboard', '{"user_type": "paid", "plan": "pro", "company_size": "medium"}', '2024-10-26 14:30:00+00'),
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', 'csv', 'The mobile app crashes when I try to upload files. Very frustrating.', 'negative', 'mobile', '{"user_type": "paid", "plan": "pro", "company_size": "large"}', '2024-10-27 09:15:00+00');

-- Insert sample insights
INSERT INTO insights (id, company_id, title, summary, theme, segment_context, insight_score, urgency_score, volume_score, value_alignment_score) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Onboarding Friction for Trial Users', 'Trial users are experiencing significant friction during onboarding, leading to high abandonment rates', 'onboarding', '{"primary_segment": "trial_users", "company_sizes": ["small", "medium"], "plans": ["free"]}', 0.85, 0.9, 0.7, 0.95),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Mobile App Stability Issues', 'Pro users are reporting frequent crashes in the mobile app, particularly with file uploads', 'mobile_stability', '{"primary_segment": "pro_users", "company_sizes": ["medium", "large"], "plans": ["pro"]}', 0.78, 0.85, 0.6, 0.8);

-- Link insights to feedback (evidence)
INSERT INTO insight_feedback_links (insight_id, feedback_id, relevance_score) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', 1.0),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440009', 1.0);

-- Link insights to features
INSERT INTO insight_feature_links (insight_id, feature_id, impact_score) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 0.95);

-- Link insights to objectives
INSERT INTO insight_objective_links (insight_id, objective_id, alignment_score) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 0.9),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 0.7);

-- Insert Samba company
INSERT INTO companies (id, name, slug, industry, size) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'Samba',
  'samba',
  'Music Streaming',
  'startup'
);

-- Insert Samba product
INSERT INTO products (id, company_id, name, description, metadata) VALUES 
('660e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440001', 'Samba Music Platform', 'Core music streaming platform', '{"type": "web_platform", "region": "latin_america"}');

-- Create product areas for Samba based on their feedback themes
INSERT INTO product_areas (id, product_id, name, description, keywords) VALUES 
('660e8400-e29b-41d4-a716-446655440030', '660e8400-e29b-41d4-a716-446655440010', 'Music Discovery', 'Playlist discovery and recommendations', ARRAY['playlist', 'discovery', 'recommendations', 'personalization', 'mood']),
('660e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440010', 'Mobile Experience', 'Mobile app performance and features', ARRAY['mobile', 'app', 'performance', 'crashes', 'loading']),
('660e8400-e29b-41d4-a716-446655440032', '660e8400-e29b-41d4-a716-446655440010', 'Social Features', 'Sharing and social interactions', ARRAY['social', 'sharing', 'friends', 'community']),
('660e8400-e29b-41d4-a716-446655440033', '660e8400-e29b-41d4-a716-446655440010', 'Search & Discovery', 'Music search functionality', ARRAY['search', 'find', 'browse', 'explore']),
('660e8400-e29b-41d4-a716-446655440034', '660e8400-e29b-41d4-a716-446655440010', 'Customer Support', 'Help and support features', ARRAY['support', 'help', 'customer service', 'billing questions']),
('660e8400-e29b-41d4-a716-446655440035', '660e8400-e29b-41d4-a716-446655440010', 'Content Library', 'Music catalog and content', ARRAY['music', 'songs', 'artists', 'albums', 'local', 'international']),
('660e8400-e29b-41d4-a716-446655440036', '660e8400-e29b-41d4-a716-446655440010', 'Subscription & Pricing', 'Pricing and subscription management', ARRAY['pricing', 'subscription', 'ads', 'free tier', 'premium']);

-- Insert sample feedback for Samba
INSERT INTO feedback_items (id, company_id, source, content, sentiment, product_area, user_metadata, submitted_at) VALUES
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'Love the new playlist discovery feature! It really understands my music taste.', 'positive', 'features', '{"user_type": "premium", "plan": "premium", "region": "Brazil"}', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'Audio quality is excellent, but sometimes the app crashes on my phone.', 'negative', 'mobile', '{"user_type": "free", "plan": "free", "region": "Mexico"}', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'The social sharing features are amazing! Love sharing my favorite tracks.', 'positive', 'social', '{"user_type": "premium", "plan": "premium", "region": "Argentina"}', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'Good music selection but the search function could be more accurate.', 'neutral', 'search', '{"user_type": "free", "plan": "free", "region": "Chile"}', NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'Customer support was super helpful when I had billing questions.', 'positive', 'support', '{"user_type": "premium", "plan": "premium", "region": "Colombia"}', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'Love the offline download feature for commuting!', 'positive', 'features', '{"user_type": "premium", "plan": "premium", "region": "Peru"}', NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'App is too slow to load, especially during peak hours.', 'negative', 'performance', '{"user_type": "free", "plan": "free", "region": "Venezuela"}', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'The curated playlists for different moods are perfect!', 'positive', 'content', '{"user_type": "premium", "plan": "premium", "region": "Uruguay"}', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'Great variety of international music, but need more local artists.', 'neutral', 'content', '{"user_type": "free", "plan": "free", "region": "Ecuador"}', NOW() - INTERVAL '9 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'csv', 'Subscription price is reasonable but ads on free tier are too frequent.', 'negative', 'pricing', '{"user_type": "free", "plan": "free", "region": "Bolivia"}', NOW() - INTERVAL '10 days');

-- Insert sample insights for Samba
INSERT INTO insights (id, company_id, title, summary, theme, segment_context, insight_score, urgency_score, volume_score, value_alignment_score) VALUES
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 
   'Users Love Personalized Features', 
   'Strong positive feedback on playlist discovery and mood-based recommendations shows users value personalization features highly', 
   'personalization', 
   '{"primary_segment": "premium_users", "regions": ["Brazil", "Argentina", "Uruguay"], "plans": ["premium"]}', 
   0.85, 0.92, 0.78, 0.88),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 
   'Mobile App Performance Issues', 
   'Multiple reports of app crashes and slow loading times indicate need for mobile optimization, especially affecting free tier users', 
   'mobile_performance', 
   '{"primary_segment": "mobile_users", "regions": ["Mexico", "Venezuela"], "plans": ["free", "premium"]}', 
   0.78, 0.88, 0.65, 0.82),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 
   'Content Library Expansion Needed', 
   'Users appreciate music variety but consistently request more local and independent artists, indicating content gap', 
   'content_strategy', 
   '{"primary_segment": "regional_users", "regions": ["Ecuador", "Chile"], "plans": ["free"]}', 
   0.65, 0.75, 0.72, 0.70);

-- Add sample features for Samba
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, metadata) VALUES 
('660e8400-e29b-41d4-a716-446655440040', '660e8400-e29b-41d4-a716-446655440030', '660e8400-e29b-41d4-a716-446655440001', 'AI Playlist Generation', 'Smart playlist creation based on mood', 'in_progress', 'critical', 9, 10, '{"team": "ml", "region": "latam"}'),
('660e8400-e29b-41d4-a716-446655440041', '660e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440001', 'Mobile Performance Optimization', 'Improve app loading and crash prevention', 'planned', 'critical', 7, 9, '{"team": "mobile", "region": "latam"}'),
('660e8400-e29b-41d4-a716-446655440042', '660e8400-e29b-41d4-a716-446655440035', '660e8400-e29b-41d4-a716-446655440001', 'Local Artist Integration', 'Add more regional and independent artists', 'planned', 'high', 8, 8, '{"team": "content", "region": "latam"}');

-- Add more features for Demo Company
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'Email Verification', 'Verify user email during signup', 'in_progress', 'high', 3, 9, '{"team": "frontend", "epic": "onboarding_v2"}'),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'Social Login', 'Allow signup with Google/Apple', 'planned', 'medium', 5, 7, '{"team": "frontend", "epic": "onboarding_v2"}');
