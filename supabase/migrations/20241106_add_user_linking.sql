-- Add user linking to all entities
-- This migration adds user_id references to track ownership/creation
-- Simple approach: user_id = owner/creator of the record

-- Add user_id to companies table (company owner/admin)
ALTER TABLE companies 
ADD COLUMN user_id UUID;

-- Add user_id to products table (product owner)
ALTER TABLE products
ADD COLUMN user_id UUID;

-- Add user_id to product_areas table (area owner)
ALTER TABLE product_areas
ADD COLUMN user_id UUID;

-- Add user_id to objectives table (objective owner)
ALTER TABLE objectives
ADD COLUMN user_id UUID;

-- Add user_id to features table (feature owner)
ALTER TABLE features
ADD COLUMN user_id UUID;

-- Add user_id to feedback_items table (user who submitted the feedback)
ALTER TABLE feedback_items
ADD COLUMN user_id UUID;

-- Add user_id to insights table (insight creator/owner)
ALTER TABLE insights
ADD COLUMN user_id UUID;

-- Add user_id to junction tables (who created the link)
ALTER TABLE insight_feedback_links
ADD COLUMN user_id UUID;

ALTER TABLE insight_feature_links  
ADD COLUMN user_id UUID;

ALTER TABLE insight_objective_links
ADD COLUMN user_id UUID;

-- Create indexes for user-based queries
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_product_areas_user_id ON product_areas(user_id);
CREATE INDEX idx_objectives_user_id ON objectives(user_id);
CREATE INDEX idx_features_user_id ON features(user_id);
CREATE INDEX idx_feedback_user_id ON feedback_items(user_id);
CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insight_feedback_links_user_id ON insight_feedback_links(user_id);
CREATE INDEX idx_insight_feature_links_user_id ON insight_feature_links(user_id);
CREATE INDEX idx_insight_objective_links_user_id ON insight_objective_links(user_id);

-- Add composite indexes for common user-based queries
CREATE INDEX idx_companies_user_company ON companies(user_id, id);
CREATE INDEX idx_products_user_company ON products(user_id, company_id);
CREATE INDEX idx_features_user_status ON features(user_id, status);
CREATE INDEX idx_features_user_priority ON features(user_id, priority);
CREATE INDEX idx_feedback_user_sentiment ON feedback_items(user_id, sentiment);
CREATE INDEX idx_insights_user_score ON insights(user_id, insight_score DESC);

-- Add comments to document the user relationships (simplified)
COMMENT ON COLUMN companies.user_id IS 'Company owner/admin who created and manages this company';
COMMENT ON COLUMN products.user_id IS 'Product owner/manager responsible for this product';
COMMENT ON COLUMN product_areas.user_id IS 'User responsible for this product area';
COMMENT ON COLUMN objectives.user_id IS 'User who owns/created this objective';
COMMENT ON COLUMN features.user_id IS 'User who owns/created this feature';
COMMENT ON COLUMN feedback_items.user_id IS 'End user who provided the feedback';
COMMENT ON COLUMN insights.user_id IS 'User who created/owns this insight';
COMMENT ON COLUMN insight_feedback_links.user_id IS 'User who created this insight-feedback link';
COMMENT ON COLUMN insight_feature_links.user_id IS 'User who created this insight-feature link';
COMMENT ON COLUMN insight_objective_links.user_id IS 'User who created this insight-objective link';
