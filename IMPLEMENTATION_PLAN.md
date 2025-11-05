# InsightLoop Implementation Plan

## Architecture Overview
**Data Flow:** UI → Hooks → Routes → Services → Repository → Supabase

## Phase 1: Foundation & Core Setup

### 1.1 Database Schema (Supabase)
```sql
-- Companies (Multi-tenant)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Portfolio
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OKRs/Objectives
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  quarter TEXT,
  year INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Backlog
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog', -- backlog, in_progress, completed
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  effort_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback Repository
CREATE TABLE feedback_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  source TEXT NOT NULL, -- csv, intercom, zendesk, etc.
  content TEXT NOT NULL,
  sentiment TEXT, -- positive, negative, neutral
  product_area TEXT,
  user_metadata JSONB,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI-Generated Insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  theme TEXT,
  segment_context JSONB,
  insight_score DECIMAL DEFAULT 0,
  urgency_score DECIMAL DEFAULT 0,
  volume_score DECIMAL DEFAULT 0,
  value_alignment_score DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link Insights to Feedback (Evidence)
CREATE TABLE insight_feedback_links (
  insight_id UUID REFERENCES insights(id),
  feedback_id UUID REFERENCES feedback_items(id),
  PRIMARY KEY (insight_id, feedback_id)
);

-- Link Insights to Features
CREATE TABLE insight_feature_links (
  insight_id UUID REFERENCES insights(id),
  feature_id UUID REFERENCES features(id),
  PRIMARY KEY (insight_id, feature_id)
);

-- Link Insights to OKRs
CREATE TABLE insight_objective_links (
  insight_id UUID REFERENCES insights(id),
  objective_id UUID REFERENCES objectives(id),
  PRIMARY KEY (insight_id, objective_id)
);
```

### 1.2 Repository Layer (`src/lib/repositories/`)
```typescript
// BaseRepository.ts
export abstract class BaseRepository<T> {
  constructor(protected supabase: SupabaseClient) {}
  
  abstract create(data: Partial<T>): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filters?: any): Promise<T[]>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
}

// CompanyRepository.ts
// ProductRepository.ts
// ObjectiveRepository.ts
// FeatureRepository.ts
// FeedbackRepository.ts
// InsightRepository.ts
```

### 1.3 Service Layer (`src/lib/services/`)
```typescript
// FeedbackService.ts - Handle ingestion & processing
// InsightService.ts - AI clustering & scoring
// PrioritizationService.ts - Strategic prioritization
// ExportService.ts - Jira integration
```

### 1.4 API Routes (`src/app/api/`)
```
/api/companies/
/api/products/
/api/objectives/
/api/features/
/api/feedback/
  - POST /upload (CSV upload)
  - GET /list
/api/insights/
  - POST /generate (trigger AI processing)
  - GET /list
/api/integrations/
  - POST /jira/link
```

### 1.5 Custom Hooks (`src/hooks/`)
```typescript
// useCompany.ts
// useFeedback.ts
// useInsights.ts
// useFeatures.ts
// useObjectives.ts
// useJiraIntegration.ts
```

### 1.6 UI Components (`src/components/`)
```
/layout/
  - Sidebar.tsx
  - Header.tsx
  - Navigation.tsx

/feedback/
  - FeedbackList.tsx
  - FeedbackUpload.tsx
  - FeedbackItem.tsx

/insights/
  - InsightsBoard.tsx
  - InsightCard.tsx
  - EvidenceDrillDown.tsx

/features/
  - FeatureBacklog.tsx
  - FeatureCard.tsx

/integrations/
  - JiraLinking.tsx
  - IntegrationsSetup.tsx

/common/
  - DataTable.tsx
  - Modal.tsx
  - LoadingSpinner.tsx
```

## Phase 2: Core Features Implementation

### 2.1 Company Setup & Product Portfolio
**Routes:**
- `/dashboard` - Company overview
- `/products` - Product portfolio management
- `/objectives` - OKRs management

**Implementation Order:**
1. Company repository & service
2. Product repository & service  
3. Objective repository & service
4. UI components for setup
5. API routes
6. Custom hooks

### 2.2 Feedback Ingestion
**Routes:**
- `/feedback` - Feedback list & management
- `/feedback/upload` - CSV upload interface

**Implementation Order:**
1. Feedback repository with CSV parsing
2. Feedback service with auto-tagging
3. Upload UI component
4. API route for processing
5. Custom hooks for feedback management

### 2.3 AI Insight Engine
**Routes:**
- `/insights` - Insights board
- `/insights/[id]` - Insight detail with evidence

**Implementation Order:**
1. Insight repository & linking tables
2. AI service integration (OpenAI/Claude)
3. Clustering & scoring algorithms
4. Insight UI components
5. Evidence drill-down components
6. API routes for AI processing

### 2.4 Feature Linking & Prioritization
**Routes:**
- `/features` - Feature backlog
- `/prioritization` - Strategic prioritization engine

**Implementation Order:**
1. Feature repository with insight links
2. Prioritization service (ICE/RICE models)
3. Feature management UI
4. Prioritization interface
5. API routes for scoring

## Phase 3: Advanced Features

### 3.1 Jira Integration
**Routes:**
- `/integrations` - Integration setup
- `/integrations/jira` - Jira linking flow

**Implementation Order:**
1. Jira API service
2. Integration repository for storing connections
3. Jira linking UI components
4. API routes for Jira operations

### 3.2 Strategic Dashboard
**Routes:**
- `/dashboard/strategic` - High-level insights view
- `/reports` - Export & reporting

**Implementation Order:**
1. Analytics service
2. Dashboard components
3. Export functionality
4. Reporting UI

## Phase 4: Polish & Scale

### 4.1 Advanced AI Features
- Theme building & clustering improvements
- Sentiment analysis enhancement
- Threading logic for related feedback

### 4.2 Performance & Scale
- Caching layer (Redis)
- Background job processing
- Search optimization

### 4.3 Enterprise Features
- Multi-tenant security
- Advanced permissions
- Audit logging

## Implementation Timeline

**Week 1-2:** Database setup, repositories, and basic services
**Week 3-4:** Core UI components and feedback ingestion
**Week 5-6:** AI insight engine and clustering
**Week 7-8:** Feature linking and prioritization
**Week 9-10:** Jira integration and strategic dashboard
**Week 11-12:** Polish, testing, and performance optimization

## Technology Stack

- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Supabase
- **Database:** PostgreSQL (via Supabase)
- **AI:** OpenAI GPT-4/Claude for clustering & analysis
- **Integrations:** Jira REST API
- **Deployment:** Vercel
- **State Management:** React hooks + SWR/TanStack Query

## Next Steps

1. Set up Supabase project and create initial schema
2. Implement base repository pattern
3. Create company/product setup flow
4. Build feedback upload and display functionality
5. Integrate AI for insight generation

Would you like me to start implementing any specific phase or component?
