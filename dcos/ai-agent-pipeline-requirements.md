# Feedback Processing Pipeline Design with LangGraph

## Overview
This document outlines the design for a comprehensive feedback processing pipeline that takes CSV/JSON feedback data through multiple AI-powered stages: enrichment, clustering, insight generation, and scoring. The pipeline provides full UI visibility and progress reporting using LangGraph for orchestration.

## Core Philosophy
**Structured Pipeline Processing**: Transform raw feedback data through a series of AI agents that add value at each stage, culminating in prioritized, actionable business insights with clear evidence trails.

**Schema Flexibility**: We don't assume a predefined schema for feedback data, user data, or product areas. The system must dynamically discover and adapt to the structure of incoming data.

## Prerequisites: Foundational Data System

Before the pipeline can process feedback, we need a foundational system with four core entities:

### Core Entities Required
1. **Products**: The products that users provide feedback on
2. **Product Areas**: Specific areas/features within products (e.g., "onboarding", "billing")
3. **Feedback List**: Collection of feedback entries to be processed
4. **Users**: User profiles with metadata (plan type, segment, usage)

### Schema Discovery Approach
**Challenge**: We cannot know the schema beforehand for:
- Feedback structure (fields may vary by source)
- User data format (different metadata across sources)
- Product area organization (company-specific categorization)

**Solution**: AI-powered schema discovery and flexible data storage
- First-pass AI analysis to discover data structure
- Dynamic field mapping and normalization
- Flexible storage that adapts to discovered schemas
- User confirmation and correction of discovered structures

## 1. Foundational Data System Setup

### Phase 0: Core Entity Creation (MUST EXIST BEFORE PIPELINE)

#### Entity 1: Products
**Purpose**: Define the products that receive feedback
**Required Before**: Any feedback processing can begin
**Schema**: Flexible, company-defined structure

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>; // Flexible metadata
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entity 2: Product Areas
**Purpose**: Categorize different parts/features of products
**Relationship**: Belongs to a Product
**Schema Discovery**: AI can suggest product areas from feedback, but needs confirmation
**Examples**: "onboarding", "billing", "features", "support", "API", "dashboard"

```typescript
interface ProductArea {
  id: string;
  productId: string;
  name: string;
  description?: string;
  keywords?: string[]; // AI can populate from feedback analysis
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entity 3: Users
**Purpose**: Store user profiles with metadata for segmentation
**Schema Discovery**: Must adapt to different user data formats
**Key Challenge**: User metadata varies by company (plan types, usage metrics, segments)

```typescript
interface User {
  id: string;
  externalId?: string; // ID from external system
  email?: string;
  name?: string;
  metadata: Record<string, any>; // FLEXIBLE - discovered from data
  // Examples: { plan: "pro", teamSize: 5, usage: "high", segment: "enterprise" }
  createdAt: Date;
  updatedAt: Date;
}
```

#### Entity 4: Feedback List
**Purpose**: Store raw feedback entries before pipeline processing
**Schema Discovery**: Must handle various feedback formats (CSV, JSON, etc.)
**Key Challenge**: Feedback structure varies by source (surveys, tickets, interviews)

```typescript
interface Feedback {
  id: string;
  userId: string;
  productId: string;
  text: string; // Core feedback content
  source: string; // "survey", "support", "interview", "slack", etc.
  timestamp: Date;
  rawData: Record<string, any>; // FLEXIBLE - original data preserved
  status: 'pending' | 'processing' | 'processed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Setup Flow
```
1. Create/Import Products
2. Define/Discover Product Areas (AI-assisted)
3. Import/Sync Users (with schema discovery)
4. Import Feedback (with schema discovery)
5. → READY for Pipeline Processing
```

### Schema Discovery Process
**For each entity import (Users, Feedback):**

1. **AI Analysis**: Analyze sample data to discover structure
   - Identify fields and data types
   - Suggest field mappings
   - Detect relationships

2. **User Confirmation**: Present discovered schema to user
   - Show field mappings
   - Allow corrections and adjustments
   - Save confirmed schema for future imports

3. **Flexible Storage**: Store data with discovered schema
   - Preserve original structure in `rawData`
   - Map to normalized fields for processing
   - Allow schema evolution over time

### Data Import Requirements
- **CSV Import**: Column header detection and mapping
- **JSON Import**: Nested object flattening and field extraction
- **Schema Versioning**: Track schema changes over time
- **Data Validation**: Validate against discovered schema
- **Error Handling**: Clear error messages for schema mismatches

## 2. LangGraph Pipeline Architecture

**PREREQUISITE**: All four core entities (Products, Product Areas, Users, Feedback) must exist before pipeline execution.

### Pipeline Trigger
Once foundational data is ready, pipeline processes the Feedback List:
```
Feedback List (status: pending) → Pipeline → Enriched Insights (status: processed)
```

### Pipeline Flow
```
Feedback Input → Enrichment → Semantic Clustering → Insight Generation → Insight Scoring → Dashboard
```

### Stage 1: Feedback Enrichment Agent
**Purpose**: Enrich each feedback entry with structured metadata
**Processing**: Individual feedback analysis using AI
**Outputs**: 
- **Product area tagging** → "onboarding", "billing", "features", etc.
- **Sentiment extraction** → "negative/confused", "positive/excited", etc.
- **User segment mapping** → "Pro plan", "team size 1-3", "high usage"
- **Feature linking** → Connect feedback to specific product modules
- **Urgency assessment** → Based on language patterns and user value

### Stage 2: Semantic Clustering Agent  
**Purpose**: Group feedback with similar meaning using AI-powered thematic clustering
**Technique**: BERTopic or GPT embedding clustering for semantic similarity
**Outputs**:
- Feedback clusters grouped by common themes
- Cluster themes and descriptions
- Similarity scores between feedback items
- Cluster metadata (size, sentiment distribution, user segments)

### Stage 3: Insight Generator Agent
**Purpose**: Generate structured business insights from each cluster
**Processing**: AI analysis of clustered feedback using structured prompts
**Template**: "Summarize this cluster of [X] feedback entries from [segment]. What is the common pain, how severe is it, and what do they want?"
**Outputs**:
- Pain point identification
- Severity assessment  
- User desire analysis
- Recommended actions
- Evidence trails linking back to original feedback

### Stage 4: Insight Scorer Agent
**Purpose**: Prioritize insights based on business impact
**Scoring Factors**:
- **Volume**: How many users reported this issue
- **User Value**: Pro plans, high usage, enterprise customers weighted higher
- **Recency**: Recent signals scored higher than old feedback  
- **Strategic Alignment**: Connection to company OKRs and priorities
**Output**: Numerical insight scores for sorting and prioritization

## 3. Progress Reporting & UI Visibility

### Real-time Progress Tracking
**Requirement**: Full visibility into pipeline execution with live updates to the UI
**Implementation**: Server-Sent Events (SSE) streaming progress updates

### Progress Stages
1. **Input Validation** (0-10%): Validating CSV/JSON structure and required fields
2. **Feedback Enrichment** (10-50%): AI processing each feedback entry for metadata
3. **Semantic Clustering** (50-70%): Grouping similar feedback using embeddings
4. **Insight Generation** (70-85%): Creating structured insights from clusters  
5. **Insight Scoring** (85-100%): Calculating business priority scores

### Progress Data Points
- Current stage and step description
- Percentage completion (0-100%)
- Processing rate (entries per second)
- Estimated time remaining
- Real-time error reporting
- Batch processing status

### UI Dashboard Features
- **Live Progress Bar**: Visual progress through pipeline stages
- **Stage Indicators**: Clear visual markers for each processing stage
- **Processing Metrics**: Speed, throughput, and performance data
- **Error Handling**: Real-time error display with retry options
- **Results Preview**: Early preview of insights as they're generated

## 4. LangGraph Technical Architecture

### Graph Structure
**LangGraph Implementation**: Sequential processing with state management
**State Management**: Pipeline state passed between nodes with progress tracking
**Node Architecture**: Each processing stage as a dedicated graph node

### Node Definitions
1. **Input Validation Node**: Validate and normalize feedback data
2. **Enrichment Node**: AI-powered metadata extraction per feedback entry
3. **Clustering Node**: Semantic grouping using embeddings and AI analysis
4. **Insight Generation Node**: Structured insight creation from clusters
5. **Scoring Node**: Business impact scoring and prioritization

### State Management
```typescript
interface PipelineState {
  batchId: string;
  feedbackEntries: FeedbackEntry[];
  enrichedEntries: EnrichedFeedbackEntry[];
  clusters: FeedbackCluster[];
  insights: GeneratedInsight[];
  scoredInsights: ScoredInsight[];
  progress: PipelineProgress;
  errors: PipelineError[];
}
```

### Error Handling Strategy
- **Graceful Degradation**: Continue processing with partial failures
- **Retry Logic**: Automatic retry for transient AI model errors
- **Fallback Processing**: Basic processing when AI agents fail
- **Progress Preservation**: Resume from last successful checkpoint

## 5. Expected Outputs & Success Criteria

### Final Pipeline Output
**Structured Insights**: Prioritized list of actionable business insights
**Evidence Linking**: Each insight connected to specific feedback entries
**Business Scoring**: Numerical priority scores for product team decision-making
**Cluster Analysis**: Themed groups of similar feedback for deeper analysis

### Success Metrics
**Processing Accuracy**:
- [ ] 95%+ successful feedback enrichment with valid product area tagging
- [ ] Meaningful semantic clustering validated by business stakeholders
- [ ] Insight relevance score >80% based on product team feedback
- [ ] Score correlation with actual business priorities and OKRs

**Performance Targets**:
- [ ] Process 1000+ feedback entries in <10 minutes
- [ ] Real-time progress updates with <1 second latency
- [ ] 99.9% pipeline completion rate without manual intervention
- [ ] <2% error rate with automatic recovery mechanisms

**Business Impact**:
- [ ] Insights directly actionable by product and engineering teams
- [ ] 50% reduction in manual feedback analysis time
- [ ] Clear evidence trails for all recommendations
- [ ] Priority alignment with quarterly business objectives

## 6. Implementation Phases

### Phase 0: Foundational Data System (Week 1-2) **← START HERE**
- [ ] Database schema for Products, Product Areas, Users, Feedback
- [ ] AI-powered schema discovery for Users and Feedback imports
- [ ] CSV/JSON import with flexible field mapping
- [ ] Product and Product Area management UI
- [ ] User data import with schema confirmation
- [ ] Feedback list import with validation
- [ ] Data relationship validation (Users → Feedback, Products → Product Areas)

### Phase 1: Core Pipeline Infrastructure (Week 3-4)
- [ ] LangGraph pipeline structure with sequential nodes
- [ ] Input validation using discovered schemas
- [ ] Basic progress tracking and UI integration
- [ ] Error handling and recovery mechanisms

### Phase 2: AI Agent Development (Week 5-6)
- [ ] Feedback enrichment agent with dynamic product area discovery
- [ ] Sentiment analysis and user segment mapping
- [ ] Semantic clustering using embeddings and AI
- [ ] Batch processing optimization for large datasets

### Phase 3: Insight Generation (Week 7-8)
- [ ] Structured insight generation from clusters
- [ ] Business impact scoring algorithm
- [ ] Evidence trail linking back to original feedback
- [ ] Priority ranking and recommendation system

### Phase 4: UI & Optimization (Week 9-10)
- [ ] Real-time progress dashboard with SSE streaming
- [ ] Results visualization and insight management
- [ ] Performance optimization and caching
- [ ] Production deployment and monitoring

## 7. Technical Implementation Details

### LangGraph Configuration
- **Sequential Processing**: Each stage processes all data before moving to next
- **State Persistence**: Pipeline state maintained across all nodes
- **Progress Emission**: Real-time updates sent to UI via Server-Sent Events
- **Error Recovery**: Checkpoint system allows resume from failures

### AI Model Integration
- **Local AI Models**: GPT-OSS-20B via Ollama for cost-effective processing
- **ChatWrapper Integration**: Reuse existing chat infrastructure
- **Batch Processing**: Process feedback in configurable batch sizes (default: 10)
- **Prompt Engineering**: Structured prompts for consistent AI outputs

### Performance Optimization
- **Parallel Processing**: Multiple enrichment batches processed simultaneously
- **Caching Strategy**: Cache AI responses for similar feedback text
- **Rate Limiting**: Prevent AI model overload with request throttling
- **Resource Monitoring**: Track processing costs and model usage

### Data Management
- **Pipeline State**: Complete state preserved for recovery and analysis
- **Result Storage**: Structured storage of insights with full lineage
- **Evidence Preservation**: Original feedback linked to generated insights
- **Audit Logging**: Complete processing history for compliance and debugging
