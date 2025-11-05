-- Insert Samba company
INSERT INTO companies (id, name, industry, description, created_at) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'Samba',
  'Music Streaming',
  'A revolutionary music streaming platform that brings the rhythm of life to your ears',
  NOW()
);

-- Insert sample feedback for Samba
INSERT INTO feedback (id, company_id, customer_name, customer_email, rating, comment, category, product_feature, created_at) VALUES
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Maria Santos', 'maria@email.com', 5, 'Love the new playlist discovery feature! It really understands my music taste.', 'Feature', 'Playlist Discovery', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Carlos Rodriguez', 'carlos@email.com', 4, 'Audio quality is excellent, but sometimes the app crashes on my phone.', 'Product', 'Mobile App', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Ana Silva', 'ana@email.com', 5, 'The social sharing features are amazing! Love sharing my favorite tracks.', 'Feature', 'Social Features', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Pedro Lima', 'pedro@email.com', 3, 'Good music selection but the search function could be more accurate.', 'Feature', 'Search', NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Isabella Costa', 'isabella@email.com', 5, 'Customer support was super helpful when I had billing questions.', 'Service', 'Customer Support', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Rafael Oliveira', 'rafael@email.com', 4, 'Love the offline download feature for commuting!', 'Feature', 'Offline Mode', NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Lucia Fernandez', 'lucia@email.com', 2, 'App is too slow to load, especially during peak hours.', 'Product', 'Performance', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Diego Martinez', 'diego@email.com', 5, 'The curated playlists for different moods are perfect!', 'Feature', 'Mood Playlists', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Carmen Lopez', 'carmen@email.com', 4, 'Great variety of international music, but need more local artists.', 'Content', 'Music Library', NOW() - INTERVAL '9 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'Miguel Torres', 'miguel@email.com', 3, 'Subscription price is reasonable but ads on free tier are too frequent.', 'Service', 'Pricing', NOW() - INTERVAL '10 days');

-- Insert sample insights for Samba
INSERT INTO insights (id, company_id, title, description, category, impact_score, confidence_level, created_at) VALUES
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 
   'Users Love Personalized Features', 
   'Strong positive feedback on playlist discovery and mood-based recommendations shows users value personalization', 
   'Feature', 0.85, 0.92, NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 
   'Mobile App Performance Issues', 
   'Multiple reports of app crashes and slow loading times indicate need for mobile optimization', 
   'Product', 0.78, 0.88, NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 
   'Content Library Expansion Needed', 
   'Users appreciate music variety but request more local and independent artists', 
   'Content', 0.65, 0.75, NOW() - INTERVAL '3 days');
