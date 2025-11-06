# Phase 0: Foundational Data System Design

## Overview
Before the feedback processing pipeline can run, we need to establish four core entities: Products, Product Areas, Users, and Feedback. This document outlines the design for creating and managing these foundational data structures with flexible, AI-powered schema discovery.

## Core Principle
**No Predefined Schemas**: We cannot assume the structure of incoming data. The system must dynamically discover and adapt to various data formats for users, feedback, and product organization.

## Entity Relationships

```
Company
  ├── Products (many)
  │   └── Product Areas (many)
  │       └── Feedback (many) ← references Product Area
  └── Users (many)
      └── Feedback (many) ← references User
```

## 1. Database Schema Design

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Flexible metadata storage
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_company ON products(company_id);
```

### Product Areas Table
```sql
CREATE TABLE product_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  keywords TEXT[], -- AI-suggested keywords for auto-tagging
  parent_area_id UUID REFERENCES product_areas(id), -- Allow nested areas
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, name)
);

CREATE INDEX idx_product_areas_product ON product_areas(product_id);
CREATE INDEX idx_product_areas_keywords ON product_areas USING GIN(keywords);
```

### Users Table (Flexible Schema)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  external_id VARCHAR(255), -- ID from external system (CRM, etc.)
  email VARCHAR(255),
  name VARCHAR(255),
  
  -- Flexible metadata storage (discovered schema)
  metadata JSONB NOT NULL DEFAULT '{}',
  -- Example: { 
  --   "plan": "pro", 
  --   "teamSize": 5, 
  --   "usage": "high",
  --   "segment": "enterprise",
  --   "mrr": 500
  -- }
  
  -- Schema tracking
  schema_version VARCHAR(50),
  raw_data JSONB, -- Original import data
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_id, external_id)
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);
```

### Feedback Table (Flexible Schema)
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  product_id UUID NOT NULL REFERENCES products(id),
  user_id UUID REFERENCES users(id),
  
  -- Core feedback fields
  text TEXT NOT NULL,
  source VARCHAR(100) NOT NULL, -- survey, support, interview, slack, etc.
  timestamp TIMESTAMP NOT NULL,
  
  -- Flexible metadata from import
  metadata JSONB NOT NULL DEFAULT '{}',
  raw_data JSONB, -- Original import data preserved
  
  -- Processing status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, processed, failed
  processed_at TIMESTAMP,
  
  -- Enrichment results (populated by pipeline)
  enrichment_data JSONB,
  -- Example: {
  --   "productArea": "onboarding",
  --   "sentiment": { "label": "negative", "score": -0.6 },
  --   "urgency": "high",
  --   "features": ["signup", "email_verification"]
  -- }
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_company ON feedback(company_id);
CREATE INDEX idx_feedback_product ON feedback(product_id);
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_timestamp ON feedback(timestamp);
CREATE INDEX idx_feedback_source ON feedback(source);
CREATE INDEX idx_feedback_metadata ON feedback USING GIN(metadata);
```

### Schema Definitions Table (Track Discovered Schemas)
```sql
CREATE TABLE schema_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  entity_type VARCHAR(50) NOT NULL, -- 'user', 'feedback'
  version VARCHAR(50) NOT NULL,
  
  -- Discovered schema structure
  schema_definition JSONB NOT NULL,
  -- Example: {
  --   "fields": [
  --     { "name": "plan", "type": "string", "mappedFrom": "subscription_tier" },
  --     { "name": "teamSize", "type": "number", "mappedFrom": "team_members" }
  --   ]
  -- }
  
  -- AI analysis metadata
  discovered_by VARCHAR(50), -- 'ai', 'manual', 'hybrid'
  confidence_score DECIMAL(3,2),
  sample_count INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_id, entity_type, version)
);

CREATE INDEX idx_schema_company_entity ON schema_definitions(company_id, entity_type);
```

## 2. Schema Discovery Flow

### Step 1: Data Upload
User uploads CSV or JSON file with user or feedback data.

### Step 2: AI Schema Analysis
```typescript
interface SchemaDiscoveryRequest {
  entityType: 'user' | 'feedback';
  sampleData: any[]; // First 10-20 rows
  sourceFormat: 'csv' | 'json';
}

interface DiscoveredSchema {
  fields: DiscoveredField[];
  confidence: number;
  suggestedMappings: FieldMapping[];
  warnings: string[];
}

interface DiscoveredField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  nullable: boolean;
  examples: any[];
  suggestedNormalization?: string; // e.g., "lowercase", "trim"
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  confidence: number;
}
```

### Step 3: AI Prompt for Schema Discovery
```
Analyze this sample data and discover its structure:

Entity Type: {user/feedback}
Sample Data (first 10 rows):
{JSON.stringify(sampleData)}

Tasks:
1. Identify all fields and their data types
2. Suggest standard field mappings (e.g., "email_address" → "email")
3. Detect user metadata fields (plan, segment, usage, etc.)
4. Identify required vs optional fields
5. Suggest data transformations if needed
6. Flag any data quality issues

Return structured JSON with your analysis.
```

### Step 4: User Confirmation UI
Present discovered schema to user:
- Show original field names → suggested normalized names
- Display sample values for each field
- Allow manual adjustments to mappings
- Preview how data will be imported
- Save confirmed schema for future imports

### Step 5: Import with Schema
Use confirmed schema to import data:
- Map source fields to target structure
- Store original data in `raw_data`
- Apply transformations
- Validate against schema
- Store with schema version

## 3. Product & Product Area Setup

### Initial Product Setup
**Manual Creation**: Users manually create products first
```typescript
interface ProductCreation {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}
```

### Product Area Discovery
**AI-Assisted Discovery**: Analyze existing feedback to suggest product areas

```
Analyze this sample feedback and suggest product areas:

Feedback samples:
1. "The signup process is confusing..."
2. "Billing page keeps crashing..."
3. "Love the new dashboard features!"
...

Tasks:
1. Identify common product areas mentioned
2. Suggest area names and descriptions
3. Generate keywords for each area
4. Organize into logical categories

Return structured JSON with suggested product areas.
```

**User Confirms**: Review and approve suggested areas before saving

## 4. Implementation Tasks

### Phase 0.1: Database Setup (Days 1-2)
- [ ] Create migration for Products table
- [ ] Create migration for Product Areas table
- [ ] Create migration for Users table with flexible schema
- [ ] Create migration for Feedback table with flexible schema
- [ ] Create migration for Schema Definitions table
- [ ] Set up indexes and constraints
- [ ] Create database repository classes

### Phase 0.2: Schema Discovery System (Days 3-5)
- [ ] Build AI schema discovery agent using ChatWrapper
- [ ] Create schema analysis prompts
- [ ] Build field mapping suggestion logic
- [ ] Create schema validation system
- [ ] Build schema versioning system
- [ ] Create schema storage and retrieval

### Phase 0.3: Import System (Days 6-8)
- [ ] CSV parser with dynamic column detection
- [ ] JSON parser with nested object handling
- [ ] Schema-based data transformation
- [ ] Validation against discovered schema
- [ ] Bulk import with error handling
- [ ] Progress tracking for large imports

### Phase 0.4: Management UI (Days 9-12)
- [ ] Product management interface (create, edit, delete)
- [ ] Product Area management (with AI suggestions)
- [ ] User import wizard with schema discovery
- [ ] Feedback import wizard with schema discovery
- [ ] Schema review and confirmation UI
- [ ] Data preview and validation UI

### Phase 0.5: API Endpoints (Days 13-14)
- [ ] POST /api/products - Create product
- [ ] GET /api/products - List products
- [ ] POST /api/product-areas/discover - AI-suggested areas
- [ ] POST /api/users/import - Import users with schema discovery
- [ ] POST /api/feedback/import - Import feedback with schema discovery
- [ ] GET /api/schemas/:entity - Get schema definition
- [ ] POST /api/schemas/validate - Validate data against schema

## 5. Success Criteria

### Data Setup
- [ ] Create products and product areas for a company
- [ ] Import user data from CSV with automatic schema discovery
- [ ] Import feedback data from JSON with automatic schema discovery
- [ ] Schema discovery achieves >90% accuracy on field mapping
- [ ] User can review and adjust discovered schemas

### Data Quality
- [ ] All imported data validated against confirmed schema
- [ ] Original raw data preserved for audit
- [ ] Clear error messages for schema mismatches
- [ ] Data relationships properly maintained (users → feedback, products → areas)

### User Experience
- [ ] Schema discovery completes in <5 seconds for 1000 rows
- [ ] Clear UI for schema review and confirmation
- [ ] Easy field mapping adjustments
- [ ] Bulk import handles 10,000+ records efficiently
- [ ] Progress tracking for long-running imports

## 6. Next Steps

After Phase 0 completion, the system will have:
✅ Products and Product Areas configured
✅ Users imported with discovered schema
✅ Feedback imported and ready for processing
✅ Flexible schema system for future imports

**Then proceed to Phase 1**: Build the LangGraph pipeline to process the feedback list.
