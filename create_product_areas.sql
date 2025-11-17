-- Complete Database Seed Script
-- Creates: 1 Company → 1 Product → Multiple Product Areas → Multiple Features per Area

-- =====================================================
-- 1. CREATE COMPANY
-- =====================================================
INSERT INTO companies (id, name, slug, industry, size, user_id, created_at, updated_at) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'TechFlow Solutions',
  'techflow',
  'Software',
  'startup',
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- =====================================================
-- 2. CREATE PRODUCT
-- =====================================================
INSERT INTO products (id, company_id, name, description, user_id, created_at, updated_at) VALUES
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ProjectHub',
  'Comprehensive project management and collaboration platform for modern teams',
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- =====================================================
-- 3. CREATE PRODUCT AREAS
-- =====================================================
INSERT INTO product_areas (id, product_id, name, description, keywords, user_id, created_at, updated_at) VALUES
-- Mobile App Area
(
  '33333333-3333-3333-3333-333333333301',
  '22222222-2222-2222-2222-222222222222',
  'Mobile App',
  'Native mobile application for iOS and Android platforms',
  ARRAY['mobile', 'app', 'iOS', 'android', 'crashes', 'photo', 'upload', 'notifications', 'push', 'offline'],
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
-- Dashboard & Analytics Area
(
  '33333333-3333-3333-3333-333333333302',
  '22222222-2222-2222-2222-222222222222',
  'Dashboard & Analytics',
  'Web dashboard interface, reporting, and data visualization',
  ARRAY['dashboard', 'UI', 'UX', 'interface', 'design', 'analytics', 'reporting', 'charts', 'metrics'],
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
-- Task Management Area
(
  '33333333-3333-3333-3333-333333333303',
  '22222222-2222-2222-2222-222222222222',
  'Task Management',
  'Core task creation, assignment, tracking, and workflow management',
  ARRAY['tasks', 'assignment', 'tracking', 'workflow', 'project', 'management', 'deadlines', 'priorities'],
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
-- Team Collaboration Area
(
  '33333333-3333-3333-3333-333333333304',
  '22222222-2222-2222-2222-222222222222',
  'Team Collaboration',
  'Real-time collaboration, communication, and file sharing features',
  ARRAY['team', 'collaboration', 'sharing', 'chat', 'communication', 'real-time', 'files', 'teamwork'],
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
-- Integrations & API Area
(
  '33333333-3333-3333-3333-333333333305',
  '22222222-2222-2222-2222-222222222222',
  'Integrations & API',
  'Third-party integrations, REST API, and developer tools',
  ARRAY['integrations', 'API', 'webhooks', 'third-party', 'developers', 'REST', 'tools', 'platform'],
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- =====================================================
-- 4. CREATE FEATURES FOR EACH PRODUCT AREA
-- =====================================================

-- Features for Mobile App Area (33333333-3333-3333-3333-333333333301)
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, user_id, created_at, updated_at) VALUES
(
  '44444444-4444-4444-4444-444444444401',
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  'Offline Mode Support',
  'Enable users to work offline and sync when connection is restored',
  'planned',
  'high',
  8,
  9,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444402',
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  'Push Notifications Enhancement',
  'Improve push notification delivery and customization options',
  'in_progress',
  'medium',
  5,
  7,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444403',
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  'Photo Upload Optimization',
  'Optimize photo upload speed and reduce crashes during upload',
  'completed',
  'high',
  6,
  8,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- Features for Dashboard & Analytics Area (33333333-3333-3333-3333-333333333302)
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, user_id, created_at, updated_at) VALUES
(
  '44444444-4444-4444-4444-444444444404',
  '33333333-3333-3333-3333-333333333302',
  '11111111-1111-1111-1111-111111111111',
  'Custom Dashboard Builder',
  'Allow users to create personalized dashboard layouts',
  'planned',
  'medium',
  9,
  8,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444405',
  '33333333-3333-3333-3333-333333333302',
  '11111111-1111-1111-1111-111111111111',
  'Advanced Reporting Suite',
  'Comprehensive reporting with export capabilities and scheduled reports',
  'in_progress',
  'high',
  7,
  9,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444406',
  '33333333-3333-3333-3333-333333333302',
  '11111111-1111-1111-1111-111111111111',
  'Dark Mode Theme',
  'Implement dark mode theme for better user experience',
  'completed',
  'low',
  4,
  6,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- Features for Task Management Area (33333333-3333-3333-3333-333333333303)
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, user_id, created_at, updated_at) VALUES
(
  '44444444-4444-4444-4444-444444444407',
  '33333333-3333-3333-3333-333333333303',
  '11111111-1111-1111-1111-111111111111',
  'Automated Task Assignment',
  'AI-powered task assignment based on team capacity and skills',
  'planned',
  'high',
  8,
  9,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444408',
  '33333333-3333-3333-3333-333333333303',
  '11111111-1111-1111-1111-111111111111',
  'Gantt Chart View',
  'Interactive Gantt chart for project timeline visualization',
  'in_progress',
  'medium',
  6,
  7,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444409',
  '33333333-3333-3333-3333-333333333303',
  '11111111-1111-1111-1111-111111111111',
  'Task Dependencies',
  'Enable task dependencies and blocking relationships',
  'completed',
  'high',
  5,
  8,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- Features for Team Collaboration Area (33333333-3333-3333-3333-333333333304)
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, user_id, created_at, updated_at) VALUES
(
  '44444444-4444-4444-4444-444444444410',
  '33333333-3333-3333-3333-333333333304',
  '11111111-1111-1111-1111-111111111111',
  'Real-time Collaborative Editing',
  'Enable multiple users to edit documents simultaneously',
  'planned',
  'high',
  9,
  9,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444411',
  '33333333-3333-3333-3333-333333333304',
  '11111111-1111-1111-1111-111111111111',
  'Team Chat Integration',
  'Integrate chat functionality within project contexts',
  'in_progress',
  'medium',
  6,
  7,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444412',
  '33333333-3333-3333-3333-333333333304',
  '11111111-1111-1111-1111-111111111111',
  'File Version Control',
  'Implement version control for shared files and documents',
  'completed',
  'medium',
  7,
  8,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- Features for Integrations & API Area (33333333-3333-3333-3333-333333333305)
INSERT INTO features (id, product_area_id, company_id, name, description, status, priority, effort_score, business_value, user_id, created_at, updated_at) VALUES
(
  '44444444-4444-4444-4444-444444444413',
  '33333333-3333-3333-3333-333333333305',
  '11111111-1111-1111-1111-111111111111',
  'Slack Integration',
  'Two-way integration with Slack for notifications and updates',
  'planned',
  'medium',
  5,
  8,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444414',
  '33333333-3333-3333-3333-333333333305',
  '11111111-1111-1111-1111-111111111111',
  'REST API v2',
  'Enhanced REST API with better rate limiting and documentation',
  'in_progress',
  'high',
  8,
  9,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
),
(
  '44444444-4444-4444-4444-444444444415',
  '33333333-3333-3333-3333-333333333305',
  '11111111-1111-1111-1111-111111111111',
  'Webhook System',
  'Comprehensive webhook system for real-time event notifications',
  'completed',
  'medium',
  6,
  7,
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);
