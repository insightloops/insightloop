-- Initial schema for InsightLoop
-- This migration creates the foundational tables for multi-tenant SaaS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (Multi-tenant root)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    industry TEXT,
    size TEXT, -- startup, small, medium, large, enterprise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    product_area TEXT, -- frontend, backend, mobile, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Objectives/OKRs table
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_value DECIMAL,
    current_value DECIMAL DEFAULT 0,
    quarter TEXT, -- Q1, Q2, Q3, Q4
    year INTEGER,
    status TEXT DEFAULT 'active', -- active, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features/Backlog table
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'backlog', -- backlog, in_progress, completed, cancelled
    priority TEXT DEFAULT 'medium', -- low, medium, high, critical
    effort_score INTEGER CHECK (effort_score >= 1 AND effort_score <= 10),
    business_value INTEGER CHECK (business_value >= 1 AND business_value <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback items table
CREATE TABLE feedback_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- csv, intercom, zendesk, manual, etc.
    content TEXT NOT NULL,
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    product_area TEXT,
    user_metadata JSONB DEFAULT '{}', -- flexible user data
    submitted_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-generated insights table
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    theme TEXT,
    segment_context JSONB DEFAULT '{}',
    insight_score DECIMAL DEFAULT 0 CHECK (insight_score >= 0 AND insight_score <= 1),
    urgency_score DECIMAL DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 1),
    volume_score DECIMAL DEFAULT 0 CHECK (volume_score >= 0 AND volume_score <= 1),
    value_alignment_score DECIMAL DEFAULT 0 CHECK (value_alignment_score >= 0 AND value_alignment_score <= 1),
    status TEXT DEFAULT 'active', -- active, archived, implemented
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table: Insights ← → Feedback (Evidence links)
CREATE TABLE insight_feedback_links (
    insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
    feedback_id UUID NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
    relevance_score DECIMAL DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (insight_id, feedback_id)
);

-- Junction table: Insights ← → Features
CREATE TABLE insight_feature_links (
    insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    impact_score DECIMAL DEFAULT 1.0 CHECK (impact_score >= 0 AND impact_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (insight_id, feature_id)
);

-- Junction table: Insights ← → Objectives
CREATE TABLE insight_objective_links (
    insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    alignment_score DECIMAL DEFAULT 1.0 CHECK (alignment_score >= 0 AND alignment_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (insight_id, objective_id)
);

-- Create indexes for better performance
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_objectives_company_id ON objectives(company_id);
CREATE INDEX idx_features_company_id ON features(company_id);
CREATE INDEX idx_features_product_id ON features(product_id);
CREATE INDEX idx_feedback_company_id ON feedback_items(company_id);
CREATE INDEX idx_feedback_source ON feedback_items(source);
CREATE INDEX idx_feedback_sentiment ON feedback_items(sentiment);
CREATE INDEX idx_insights_company_id ON insights(company_id);
CREATE INDEX idx_insights_theme ON insights(theme);
CREATE INDEX idx_insights_score ON insights(insight_score DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for multi-tenancy
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_feedback_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_feature_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_objective_links ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later with authentication)
CREATE POLICY "Users can view own company data" ON companies FOR SELECT USING (true);
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (true);
CREATE POLICY "Users can view own objectives" ON objectives FOR SELECT USING (true);
CREATE POLICY "Users can view own features" ON features FOR SELECT USING (true);
CREATE POLICY "Users can view own feedback" ON feedback_items FOR SELECT USING (true);
CREATE POLICY "Users can view own insights" ON insights FOR SELECT USING (true);
CREATE POLICY "Users can view insight links" ON insight_feedback_links FOR SELECT USING (true);
CREATE POLICY "Users can view feature links" ON insight_feature_links FOR SELECT USING (true);
CREATE POLICY "Users can view objective links" ON insight_objective_links FOR SELECT USING (true);
