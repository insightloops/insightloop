# Feedback Upload & Processing Pipeline - Design Document

## Overview
This document details the end-to-end pipeline for uploading feedback CSV files through a chat interface, processing them through the AI pipeline (enrichment → clustering → insights → scoring), and streaming real-time progress back to the UI with insight cards.

## Core User Experience

### The Vision
```
User: "Here's our latest customer feedback from Q4" [uploads feedback.csv]
Agent: "I've received 187 feedback entries. Let me process these..."
       [Progress bar appears]
       ✓ Uploaded and validated (187 entries)
       ⏳ Enriching feedback (42/187 complete)...
       ✓ Enrichment complete
       ⏳ Semantic clustering (finding patterns)...
       ✓ Found 8 clusters
       ⏳ Generating insights (3/8 complete)...
       ✓ Insights generated
       ⏳ Scoring insights...
       ✓ Complete! Here are your top insights:

       [Insight Card 1: "Pro Users Frustrated with Onboarding"]
       Score: 87/100 | 41 feedback items | Onboarding
       "Users on Pro plans are struggling with email verification..."
       [View Details] [View Evidence]

       [Insight Card 2: "API Rate Limiting Causing Production Issues"]
       Score: 82/100 | 23 feedback items | API
       [...]
```

---

## 1. System Architecture

### 1.1 High-Level Flow
```
┌─────────────────┐
│   Chat UI       │ User uploads CSV
│  (React/Next)   │────────────────┐
└─────────────────┘                │
         ↑                         ↓
         │ SSE Progress      ┌──────────────────┐
         │ Streaming         │  Upload API      │
         │                   │  /api/chat/      │
         └───────────────────│  upload-feedback │
                            └──────────────────┘
                                    │
                                    ↓
                            ┌──────────────────┐
                            │  LangGraph       │
                            │  Pipeline        │
                            │  Orchestrator    │
                            └──────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ↓                          ↓                          ↓
    ┌─────────┐              ┌─────────┐               ┌─────────┐
    │ Enrich  │              │ Cluster │               │ Insight │
    │  Node   │──────────────│  Node   │───────────────│  Node   │
    └─────────┘              └─────────┘               └─────────┘
                                                              │
                                                              ↓
                                                       ┌─────────┐
                                                       │  Score  │
                                                       │  Node   │
                                                       └─────────┘
                                                              │
                                                              ↓
                                                    ┌──────────────────┐
                                                    │   Supabase DB    │
                                                    │  (Store Results) │
                                                    └──────────────────┘
```

---

## 2. LangGraph Pipeline Definition

### 2.1 Pipeline Nodes

```typescript
## 2. Expected CSV Schema

### Input Format
The CSV file must contain the following columns:

**Required Fields:**
```csv
text,user_id,timestamp
"The onboarding flow is confusing and takes too long",user_123,2025-01-15T10:30:00Z
"Love the new dashboard! Very intuitive",user_456,2025-01-16T14:22:00Z
"API rate limits are too restrictive for our use case",user_789,2025-01-14T09:15:00Z
```

- **text** (string): The feedback content/message
- **user_id** (string): ID of the user who provided feedback
- **timestamp** (ISO 8601 string): When the feedback was given

**Optional Fields:**
- **source** (string): Where feedback came from (`survey`, `support`, `interview`, `slack`, etc.)
- **tags** (comma-separated string): Any manually added tags

### Example CSV
```csv
text,user_id,timestamp,source,tags
"The onboarding flow is confusing and takes too long",user_123,2025-01-15T10:30:00Z,survey,"onboarding,ux"
"Love the new dashboard! Very intuitive",user_456,2025-01-16T14:22:00Z,support,""
"API rate limits are too restrictive for our use case",user_789,2025-01-14T09:15:00Z,interview,"api,limits"
"Email verification doesn't work on mobile",user_234,2025-01-17T11:45:00Z,slack,"mobile,onboarding,bug"
```

---

## 3. Database Schema for Many-to-Many Relationships

### Core Principle
**A single feedback item can be linked to:**
- ✅ Multiple product areas
- ✅ Multiple features
- ✅ Multiple sentiments (mixed emotions)
- ✅ Multiple clusters

### Schema Tables

#### 3.1 Core Feedback Table
```sql
CREATE TABLE feedback_items (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID,
  user_id UUID,
  
  text TEXT NOT NULL,
  source TEXT DEFAULT 'manual',  -- survey, support, interview, slack
  manual_tags TEXT[] DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  
  enriched_at TIMESTAMP,
  enrichment_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2 Feedback → Product Areas (Many-to-Many)
```sql
CREATE TABLE feedback_product_areas (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id),
  product_area_id UUID NOT NULL REFERENCES product_areas(id),
  
  confidence_score FLOAT DEFAULT 1.0,  -- AI confidence (0-1)
  tagged_by TEXT DEFAULT 'ai',         -- 'ai' or 'manual'
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, product_area_id)
);
```

**Example:** Feedback "Onboarding email doesn't work" can be tagged as:
- `Onboarding` (confidence: 0.95)
- `Email System` (confidence: 0.78)

#### 3.3 Feedback → Features (Many-to-Many)
```sql
CREATE TABLE feedback_features (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id),
  feature_id UUID NOT NULL REFERENCES features(id),
  
  confidence_score FLOAT DEFAULT 1.0,
  tagged_by TEXT DEFAULT 'ai',
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, feature_id)
);
```

**Example:** Feedback "I love the new dark mode but hate the loading speed" links to:
- `Dark Mode` feature
- `Performance` feature

#### 3.4 Feedback → Sentiments (Many-to-Many)
```sql
CREATE TABLE feedback_sentiments (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id),
  
  sentiment_type TEXT NOT NULL,  -- positive, negative, neutral, frustrated, excited, confused, angry, satisfied
  intensity FLOAT DEFAULT 0.5,   -- 0-1, how strong
  confidence_score FLOAT DEFAULT 1.0,
  aspect TEXT,                    -- What aspect (e.g., "pricing", "ux")
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, sentiment_type)
);
```

**Example:** Feedback "I'm frustrated with the slow onboarding but excited about the features" has:
- `frustrated` sentiment (intensity: 0.8, aspect: "onboarding")
- `excited` sentiment (intensity: 0.6, aspect: "features")

#### 3.5 Feedback → Clusters (Many-to-Many)
```sql
-- Already exists from Phase 0
CREATE TABLE cluster_memberships (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id),
  cluster_id UUID NOT NULL REFERENCES feedback_clusters(id),
  
  similarity_score FLOAT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, cluster_id)
);
```

**Example:** Feedback about "slow dashboard" could belong to:
- "Performance Issues" cluster
- "Dashboard UX" cluster

---

## 4. LangGraph Pipeline Definition

### 4.1 Pipeline State

```typescript
// Pipeline State (shared across nodes)
interface FeedbackPipelineState {
  // Input
  company_id: string
  product_id: string
  uploaded_file_path: string
  total_feedback_count: number
  
  // Progress tracking
  current_stage: PipelineStage
  progress_percentage: number
  status_message: string
  
  // Data at each stage
  raw_feedback: FeedbackItem[]
  enriched_feedback: EnrichedFeedbackItem[]
  clusters: FeedbackCluster[]
  insights: Insight[]
  scored_insights: ScoredInsight[]
  
  // Error handling
  errors: PipelineError[]
  is_complete: boolean
}

enum PipelineStage {
  UPLOADED = 'uploaded',
  VALIDATING = 'validating',
  ENRICHING = 'enriching',
  CLUSTERING = 'clustering',
  GENERATING_INSIGHTS = 'generating_insights',
  SCORING_INSIGHTS = 'scoring_insights',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

// Enriched Feedback (with many-to-many relationships)
interface EnrichedFeedbackItem {
  id: string
  text: string
  user_id?: string
  company_id: string
  product_id?: string
  source: string
  
  // Many-to-Many relationships
  product_areas: Array<{
    id: string
    name: string
    confidence: number
  }>
  
  features: Array<{
    id: string
    name: string
    confidence: number
  }>
  
  sentiments: Array<{
    type: 'positive' | 'negative' | 'neutral' | 'frustrated' | 'excited' | 'confused' | 'angry' | 'satisfied'
    intensity: number  // 0-1
    aspect?: string
  }>
  
  user_segment?: {
    plan: string
    usage: string
    team_size: number
  }
}
```

### 4.2 Node Definitions

#### Node 1: Upload & Validate
```typescript
async function uploadAndValidateNode(state: FeedbackPipelineState): Promise<Partial<FeedbackPipelineState>> {
  // Parse CSV with expected schema
  const parsedData = await parseCSV(state.uploaded_file_path)
  
  // Validate required fields: text, user_id, timestamp
  const validationErrors = []
  const validFeedback = []
  
  for (const row of parsedData) {
    if (!row.text || !row.user_id || !row.timestamp) {
      validationErrors.push({ row, error: 'Missing required fields' })
      continue
    }
    
    // Map to FeedbackItem
    validFeedback.push({
      text: row.text,
      user_id: row.user_id,
      timestamp: row.timestamp,
      source: row.source || 'manual',
      manual_tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
      company_id: state.company_id,
      product_id: state.product_id
    })
  }
  
  return {
    raw_feedback: validFeedback,
    total_feedback_count: validFeedback.length,
    current_stage: PipelineStage.ENRICHING,
    progress_percentage: 10,
    status_message: `✓ Uploaded and validated ${validFeedback.length} entries`,
    errors: validationErrors
  }
}
```

#### Node 2: Enrich Feedback
```typescript
async function enrichFeedbackNode(state: FeedbackPipelineState): Promise<Partial<FeedbackPipelineState>> {
  const enriched: EnrichedFeedbackItem[] = []
  
  // Process in batches for progress updates
  const batchSize = 10
  for (let i = 0; i < state.raw_feedback.length; i += batchSize) {
    const batch = state.raw_feedback.slice(i, i + batchSize)
    
    // Enrich each feedback item
    for (const item of batch) {
      const enrichedItem = await enrichFeedbackItem(item, state.company_id)
      enriched.push(enrichedItem)
      
      // Stream progress update
      await streamProgress({
        stage: PipelineStage.ENRICHING,
        progress: (enriched.length / state.total_feedback_count) * 30 + 10, // 10-40%
        message: `⏳ Enriching feedback (${enriched.length}/${state.total_feedback_count})...`
      })
    }
  }
  
  return {
    enriched_feedback: enriched,
    current_stage: PipelineStage.CLUSTERING,
    progress_percentage: 40,
    status_message: `✓ Enrichment complete`
  }
}

// Enrichment logic - Returns multiple tags per category
async function enrichFeedbackItem(item: FeedbackItem, companyId: string): Promise<EnrichedFeedbackItem> {
  // 1. Tag product areas (can return multiple)
  const productAreas = await tagProductAreas(item.text, companyId)
  // Returns: [
  //   { id: 'uuid1', name: 'Onboarding', confidence: 0.95 },
  //   { id: 'uuid2', name: 'Email System', confidence: 0.78 }
  // ]
  
  // 2. Extract sentiments (can detect multiple emotions)
  const sentiments = await extractSentiments(item.text)
  // Returns: [
  //   { type: 'frustrated', intensity: 0.8, aspect: 'onboarding' },
  //   { type: 'excited', intensity: 0.6, aspect: 'features' }
  // ]
  
  // 3. Map to user segment (from user metadata)
  const userSegment = await getUserSegment(item.user_id)
  
  // 4. Link to features (can link to multiple)
  const features = await linkToFeatures(item.text, productAreas, companyId)
  // Returns: [
  //   { id: 'uuid3', name: 'Email Verification', confidence: 0.88 },
  //   { id: 'uuid4', name: 'Mobile App', confidence: 0.72 }
  // ]
  
  return {
    ...item,
    product_areas: productAreas,
    features: features,
    sentiments: sentiments,
    user_segment: userSegment
  }
}
```

#### Node 3: Semantic Clustering
```typescript
async function clusterFeedbackNode(state: FeedbackPipelineState): Promise<Partial<FeedbackPipelineState>> {
  // Update progress
  await streamProgress({
    stage: PipelineStage.CLUSTERING,
    progress: 45,
    message: `⏳ Semantic clustering (finding patterns)...`
  })
  
  // Generate embeddings for all feedback
  const embeddings = await generateEmbeddings(
    state.enriched_feedback.map(f => f.text)
  )
  
  // Cluster using similarity threshold
  const clusters = await performClustering(embeddings, state.enriched_feedback)
  
  // Store clusters in DB (feedback can belong to multiple clusters)
  const storedClusters = await saveClusters(clusters, state.company_id, state.product_id)
  // This creates entries in cluster_memberships table for many-to-many relationship
  
  return {
    clusters: storedClusters,
    current_stage: PipelineStage.GENERATING_INSIGHTS,
    progress_percentage: 60,
    status_message: `✓ Found ${storedClusters.length} clusters`
  }
}
```

**Note:** A single feedback item can belong to multiple clusters if it touches on multiple themes. For example:
- Feedback: "The onboarding is confusing AND the pricing is too high"
- Belongs to both "Onboarding UX Issues" cluster AND "Pricing Concerns" cluster

#### Node 4: Generate Insights
```typescript
async function generateInsightsNode(state: FeedbackPipelineState): Promise<Partial<FeedbackPipelineState>> {
  const insights: Insight[] = []
  
  for (let i = 0; i < state.clusters.length; i++) {
    const cluster = state.clusters[i]
    
    // Stream progress
    await streamProgress({
      stage: PipelineStage.GENERATING_INSIGHTS,
      progress: 60 + (i / state.clusters.length) * 20, // 60-80%
      message: `⏳ Generating insights (${i + 1}/${state.clusters.length})...`
    })
    
    // Generate structured insight using AI
    const insight = await generateInsightFromCluster(cluster, state.company_id)
    insights.push(insight)
  }
  
  // Store insights in DB
  const storedInsights = await saveInsights(insights)
  
  return {
    insights: storedInsights,
    current_stage: PipelineStage.SCORING_INSIGHTS,
    progress_percentage: 80,
    status_message: `✓ Insights generated`
  }
}

// AI Insight Generation
async function generateInsightFromCluster(cluster: FeedbackCluster, companyId: string): Promise<Insight> {
  const feedbackItems = cluster.feedback_items
  const userMetadata = await getUserMetadataForCluster(feedbackItems)
  
  const prompt = `
Summarize this cluster of ${feedbackItems.length} feedback entries.

Feedback entries:
${feedbackItems.map((f, i) => `${i + 1}. "${f.text}" (${f.user_segment}, ${f.sentiment})`).join('\n')}

User segments: ${JSON.stringify(userMetadata)}

Provide:
1. Title: A clear, actionable title (max 10 words)
2. Summary: What is the common pain point? (2-3 sentences)
3. Severity: How critical is this? (low/medium/high/critical)
4. User impact: Which segments are affected?
5. Desired outcome: What do users want?

Respond in JSON format.
`
  
  const response = await chatWrapper.sendMessage(prompt, { format: 'json' })
  
  return {
    title: response.title,
    summary: response.summary,
    severity: response.severity,
    affected_segments: response.user_impact,
    desired_outcome: response.desired_outcome,
    cluster_id: cluster.id,
    feedback_count: feedbackItems.length,
    evidence: feedbackItems.map(f => f.id)
  }
}
```

#### Node 5: Score Insights
```typescript
async function scoreInsightsNode(state: FeedbackPipelineState): Promise<Partial<FeedbackPipelineState>> {
  await streamProgress({
    stage: PipelineStage.SCORING_INSIGHTS,
    progress: 85,
    message: `⏳ Scoring insights...`
  })
  
  const scoredInsights = await Promise.all(
    state.insights.map(insight => scoreInsight(insight, state.company_id))
  )
  
  // Sort by score descending
  scoredInsights.sort((a, b) => b.score - a.score)
  
  return {
    scored_insights: scoredInsights,
    current_stage: PipelineStage.COMPLETE,
    progress_percentage: 100,
    status_message: `✓ Complete! Generated ${scoredInsights.length} insights`,
    is_complete: true
  }
}

// Scoring algorithm
function scoreInsight(insight: Insight, companyId: string): ScoredInsight {
  const weights = {
    volume: 0.3,        // How many users
    value: 0.3,         // User value (plan tier, usage)
    recency: 0.2,       // How recent
    severity: 0.2       // How critical
  }
  
  // Volume score (0-100)
  const volumeScore = Math.min(100, (insight.feedback_count / 50) * 100)
  
  // Value score (based on user segments)
  const valueScore = calculateUserValue(insight.affected_segments)
  
  // Recency score (feedback from last 7 days = 100, older = decay)
  const recencyScore = calculateRecencyScore(insight.evidence)
  
  // Severity score
  const severityMap = { low: 25, medium: 50, high: 75, critical: 100 }
  const severityScore = severityMap[insight.severity]
  
  const totalScore = 
    volumeScore * weights.volume +
    valueScore * weights.value +
    recencyScore * weights.recency +
    severityScore * weights.severity
  
  return {
    ...insight,
    score: Math.round(totalScore),
    score_breakdown: {
      volume: volumeScore,
      value: valueScore,
      recency: recencyScore,
      severity: severityScore
    }
  }
}
```

### 2.3 LangGraph Workflow Definition

```typescript
import { StateGraph } from "@langchain/langgraph"

export function createFeedbackPipeline() {
  const workflow = new StateGraph<FeedbackPipelineState>({
    channels: {
      company_id: null,
      product_id: null,
      uploaded_file_path: null,
      total_feedback_count: null,
      current_stage: null,
      progress_percentage: null,
      status_message: null,
      raw_feedback: null,
      enriched_feedback: null,
      clusters: null,
      insights: null,
      scored_insights: null,
      errors: null,
      is_complete: null
    }
  })
  
  // Add nodes
  workflow.addNode("upload_validate", uploadAndValidateNode)
  workflow.addNode("enrich", enrichFeedbackNode)
  workflow.addNode("cluster", clusterFeedbackNode)
  workflow.addNode("generate_insights", generateInsightsNode)
  workflow.addNode("score", scoreInsightsNode)
  
  // Define edges (sequential flow)
  workflow.addEdge("upload_validate", "enrich")
  workflow.addEdge("enrich", "cluster")
  workflow.addEdge("cluster", "generate_insights")
  workflow.addEdge("generate_insights", "score")
  
  // Set entry point
  workflow.setEntryPoint("upload_validate")
  
  // Set finish point
  workflow.setFinishPoint("score")
  
  return workflow.compile()
}
```

---

## 5. Data Storage: How Relationships Are Saved

### After Enrichment Node
For each feedback item, the pipeline stores relationships in junction tables:

```typescript
// Example: Feedback "Onboarding email doesn't work on mobile"

// 1. Insert into feedback_items
const feedbackId = await insertFeedback({
  text: "Onboarding email doesn't work on mobile",
  user_id: "user_123",
  company_id: "company_xyz",
  source: "survey"
})

// 2. Tag multiple product areas
await tagProductArea(feedbackId, "onboarding_area_id", 0.95, 'ai')
await tagProductArea(feedbackId, "email_area_id", 0.78, 'ai')
await tagProductArea(feedbackId, "mobile_area_id", 0.82, 'ai')
// Creates 3 rows in feedback_product_areas

// 3. Link to multiple features
await linkFeature(feedbackId, "email_verification_feature_id", 0.88, 'ai')
await linkFeature(feedbackId, "mobile_app_feature_id", 0.72, 'ai')
// Creates 2 rows in feedback_features

// 4. Add multiple sentiments
await addSentiment(feedbackId, 'frustrated', 0.8, 'onboarding')
await addSentiment(feedbackId, 'negative', 0.6, 'mobile experience')
// Creates 2 rows in feedback_sentiments

// 5. Add to clusters (during clustering node)
await addToCluster(feedbackId, "onboarding_issues_cluster_id", 0.91)
await addToCluster(feedbackId, "mobile_bugs_cluster_id", 0.73)
// Creates 2 rows in cluster_memberships
```

### Querying Enriched Feedback
```sql
-- Get all product areas for a feedback item
SELECT pa.name, fpa.confidence_score
FROM feedback_product_areas fpa
JOIN product_areas pa ON fpa.product_area_id = pa.id
WHERE fpa.feedback_item_id = 'feedback_uuid'
ORDER BY fpa.confidence_score DESC;

-- Get all sentiments for a feedback item
SELECT sentiment_type, intensity, aspect
FROM feedback_sentiments
WHERE feedback_item_id = 'feedback_uuid'
ORDER BY intensity DESC;

-- Use the view for complete data
SELECT * FROM feedback_enriched WHERE id = 'feedback_uuid';
```

---

## 6. API Endpoints

### 3.1 Upload & Process Endpoint

**Route**: `POST /api/chat/upload-feedback`

**Purpose**: Upload CSV, start pipeline, stream progress

**Request**:
```typescript
// multipart/form-data
{
  file: File,                    // CSV file
  company_id: string,
  product_id: string,
  conversation_id?: string       // For chat context
}
```

**Response**: Server-Sent Events (SSE) stream

```typescript
// Event stream format
data: {"type": "progress", "stage": "enriching", "percentage": 25, "message": "⏳ Enriching feedback (42/187)..."}

data: {"type": "progress", "stage": "clustering", "percentage": 45, "message": "⏳ Semantic clustering..."}

data: {"type": "cluster_found", "cluster_id": "uuid", "size": 41, "preview": "Users frustrated with..."}

data: {"type": "insight_generated", "insight": {...full insight object...}}

data: {"type": "complete", "insights": [{...}, {...}], "summary": {"total_insights": 8, "avg_score": 72}}
```

**Implementation**:
```typescript
// src/app/api/chat/upload-feedback/route.ts
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const companyId = formData.get('company_id') as string
  const productId = formData.get('product_id') as string
  
  // Save uploaded file
  const filePath = await saveUploadedFile(file)
  
  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Initialize pipeline
      const pipeline = createFeedbackPipeline()
      
      // Progress callback
      const onProgress = (event: ProgressEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(data))
      }
      
      // Run pipeline with streaming progress
      const result = await pipeline.invoke(
        {
          company_id: companyId,
          product_id: productId,
          uploaded_file_path: filePath,
          current_stage: PipelineStage.VALIDATING,
          progress_percentage: 0,
          status_message: 'Starting...',
          errors: [],
          is_complete: false
        },
        {
          callbacks: [new ProgressStreamCallback(onProgress)]
        }
      )
      
      // Send final completion event
      const completeEvent = {
        type: 'complete',
        insights: result.scored_insights,
        summary: {
          total_insights: result.scored_insights.length,
          avg_score: result.scored_insights.reduce((sum, i) => sum + i.score, 0) / result.scored_insights.length
        }
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### 3.2 Chat Message Endpoint (Enhanced)

**Route**: `POST /api/chat/stream`

**Purpose**: Handle chat messages including file uploads

**Request**:
```typescript
{
  message: string,
  conversation_id: string,
  company_id: string,
  attachments?: {
    type: 'csv' | 'json',
    file_id: string,          // After upload
    metadata: {
      row_count?: number,
      preview?: string[]
    }
  }[]
}
```

**Response**: SSE stream with chat responses and pipeline events

---

## 7. UI Components

### 4.1 Chat Interface with Upload

**Component**: `FeedbackUploadChat.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { InsightCard } from '@/components/InsightCard'
import { ProgressBar } from '@/components/ui/progress'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: Attachment[]
  insights?: ScoredInsight[]
  progress?: ProgressUpdate
}

interface ProgressUpdate {
  stage: PipelineStage
  percentage: number
  message: string
}

export function FeedbackUploadChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [uploadProgress, setUploadProgress] = useState<ProgressUpdate | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handleFileUpload = async (file: File) => {
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      attachments: [{ type: 'csv', file_id: file.name }]
    }])
    
    // Add assistant acknowledgment
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'I\'ve received your feedback file. Let me process these entries...'
    }])
    
    setIsProcessing(true)
    
    // Start upload and processing
    const formData = new FormData()
    formData.append('file', file)
    formData.append('company_id', companyId)
    formData.append('product_id', productId)
    
    const response = await fetch('/api/chat/upload-feedback', {
      method: 'POST',
      body: formData
    })
    
    // Read SSE stream
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { value, done } = await reader!.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          
          if (data.type === 'progress') {
            setUploadProgress({
              stage: data.stage,
              percentage: data.percentage,
              message: data.message
            })
          } else if (data.type === 'insight_generated') {
            // Stream insights as they're generated
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1]
              if (lastMsg.role === 'assistant' && lastMsg.insights) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMsg,
                    insights: [...lastMsg.insights, data.insight]
                  }
                ]
              } else {
                return [...prev, {
                  role: 'assistant',
                  content: 'Here are your insights:',
                  insights: [data.insight]
                }]
              }
            })
          } else if (data.type === 'complete') {
            setIsProcessing(false)
            setUploadProgress(null)
            setMessages(prev => [...prev, {
              role: 'system',
              content: `✓ Complete! Generated ${data.summary.total_insights} insights with average score ${data.summary.avg_score}/100`
            }])
          }
        }
      }
    }
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-4`}>
              <p>{msg.content}</p>
              
              {/* Show insights as cards */}
              {msg.insights && (
                <div className="mt-4 space-y-3">
                  {msg.insights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
              
              {/* Show progress */}
              {msg.progress && (
                <div className="mt-3">
                  <ProgressBar value={msg.progress.percentage} />
                  <p className="text-sm mt-1">{msg.progress.message}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Live progress indicator */}
        {isProcessing && uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ProgressBar value={uploadProgress.percentage} className="mb-2" />
            <p className="text-sm text-blue-700">{uploadProgress.message}</p>
          </div>
        )}
      </div>
      
      {/* Input Area with File Upload */}
      <div className="border-t p-4">
        <FileUploadZone onUpload={handleFileUpload} disabled={isProcessing} />
      </div>
    </div>
  )
}
```

### 4.2 Insight Card Component

**Component**: `InsightCard.tsx`

```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { EvidenceModal } from '@/components/EvidenceModal'
import { useState } from 'react'

interface InsightCardProps {
  insight: ScoredInsight
}

export function InsightCard({ insight }: InsightCardProps) {
  const [showEvidence, setShowEvidence] = useState(false)
  
  const severityColor = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }
  
  const scoreColor = insight.score >= 80 ? 'text-red-600' : insight.score >= 60 ? 'text-orange-600' : 'text-gray-600'
  
  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{insight.title}</CardTitle>
              <CardDescription className="mt-1">
                {insight.product_area?.name || 'General Feedback'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${scoreColor}`}>
                {insight.score}
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">{insight.summary}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={severityColor[insight.severity]}>
              {insight.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {insight.feedback_count} feedback items
            </Badge>
            {insight.affected_segments.map(segment => (
              <Badge key={segment} variant="secondary">
                {segment}
              </Badge>
            ))}
          </div>
          
          {/* Score breakdown */}
          <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
            <div>
              <div className="font-medium">Volume</div>
              <div>{insight.score_breakdown.volume}/100</div>
            </div>
            <div>
              <div className="font-medium">Value</div>
              <div>{insight.score_breakdown.value}/100</div>
            </div>
            <div>
              <div className="font-medium">Recency</div>
              <div>{insight.score_breakdown.recency}/100</div>
            </div>
            <div>
              <div className="font-medium">Severity</div>
              <div>{insight.score_breakdown.severity}/100</div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => setShowEvidence(true)}>
            View Evidence ({insight.feedback_count})
          </Button>
        </CardFooter>
      </Card>
      
      {showEvidence && (
        <EvidenceModal
          insight={insight}
          open={showEvidence}
          onClose={() => setShowEvidence(false)}
        />
      )}
    </>
  )
}
```

### 4.3 File Upload Zone

**Component**: `FileUploadZone.tsx`

```typescript
'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'

interface FileUploadZoneProps {
  onUpload: (file: File) => void
  disabled?: boolean
}

export function FileUploadZone({ onUpload, disabled }: FileUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0])
    }
  }, [onUpload])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    disabled
  })
  
  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
      {isDragActive ? (
        <p className="text-blue-600 font-medium">Drop your feedback file here...</p>
      ) : (
        <>
          <p className="text-gray-700 font-medium mb-1">
            Drop your feedback CSV here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports CSV and JSON files
          </p>
        </>
      )}
    </div>
  )
}
```

### 4.4 Progress Bar Component

**Component**: `ui/progress.tsx`

```typescript
'use client'

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-blue-600 transition-all duration-300"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

---

## 8. Data Flow Diagram

```
┌──────────────┐
│   User       │
│  Uploads CSV │
└──────┬───────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  POST /api/chat/upload-feedback         │
│  - Save file                            │
│  - Start SSE stream                     │
│  - Initialize LangGraph pipeline        │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Node 1: Upload & Validate              │
│  - Parse CSV with schema discovery      │
│  - Map to FeedbackItem[]                │
│  Stream: "✓ Uploaded 187 entries"       │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Node 2: Enrich Feedback                │
│  - Tag product area (AI)                │
│  - Extract sentiment (AI)               │
│  - Map user segment                     │
│  - Link to feature                      │
│  Stream: "⏳ Enriching (42/187)..."      │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Node 3: Semantic Clustering            │
│  - Generate embeddings                  │
│  - Cluster by similarity                │
│  - Store clusters in DB                 │
│  Stream: "✓ Found 8 clusters"           │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Node 4: Generate Insights              │
│  - For each cluster:                    │
│    - Summarize with AI                  │
│    - Extract pain points                │
│    - Store insight                      │
│  Stream: "⏳ Generating (3/8)..."        │
│  Stream: {insight} (as generated)       │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  Node 5: Score Insights                 │
│  - Calculate volume score               │
│  - Calculate value score                │
│  - Calculate recency score              │
│  - Calculate severity score             │
│  - Sort by total score                  │
│  Stream: "✓ Complete!"                  │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│  UI: Display Insight Cards              │
│  - Show insights ranked by score        │
│  - Allow drilling into evidence         │
│  - Enable actions (link to roadmap)     │
└─────────────────────────────────────────┘
```

---

## 9. Database Schema Updates

### 9.1 Core Tables

**feedback_items** - Core feedback data
```sql
CREATE TABLE feedback_items (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID,
  user_id UUID,
  text TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  manual_tags TEXT[] DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  enriched_at TIMESTAMP,
  enrichment_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 9.2 Many-to-Many Junction Tables

**feedback_product_areas** - Links feedback to multiple product areas
```sql
CREATE TABLE feedback_product_areas (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
  product_area_id UUID NOT NULL REFERENCES product_areas(id) ON DELETE CASCADE,
  confidence_score FLOAT DEFAULT 1.0,
  tagged_by TEXT DEFAULT 'ai',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, product_area_id)
);
```

**feedback_features** - Links feedback to multiple features
```sql
CREATE TABLE feedback_features (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  confidence_score FLOAT DEFAULT 1.0,
  tagged_by TEXT DEFAULT 'ai',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, feature_id)
);
```

**feedback_sentiments** - Multiple sentiments per feedback
```sql
CREATE TABLE feedback_sentiments (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
  sentiment_type TEXT NOT NULL CHECK (sentiment_type IN 
    ('positive', 'neutral', 'negative', 'frustrated', 'excited', 'confused', 'angry', 'satisfied')
  ),
  intensity FLOAT DEFAULT 0.5,
  confidence_score FLOAT DEFAULT 1.0,
  aspect TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, sentiment_type)
);
```

**cluster_memberships** - Feedback can belong to multiple clusters (already exists)
```sql
CREATE TABLE cluster_memberships (
  id UUID PRIMARY KEY,
  feedback_item_id UUID NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES feedback_clusters(id) ON DELETE CASCADE,
  similarity_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feedback_item_id, cluster_id)
);
```

### 9.3 Helper View

**feedback_enriched** - Aggregated view with all relationships
```sql
CREATE VIEW feedback_enriched AS
SELECT 
  fi.id,
  fi.text,
  fi.user_id,
  fi.company_id,
  fi.product_id,
  fi.source,
  fi.manual_tags,
  fi.created_at,
  fi.enriched_at,
  
  -- Product areas (array of names)
  COALESCE(ARRAY_AGG(DISTINCT pa.name) FILTER (WHERE pa.id IS NOT NULL), '{}') AS product_areas,
  
  -- Features (array of names)
  COALESCE(ARRAY_AGG(DISTINCT f.name) FILTER (WHERE f.id IS NOT NULL), '{}') AS features,
  
  -- Sentiments (JSON array)
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
      'type', fs.sentiment_type,
      'intensity', fs.intensity,
      'aspect', fs.aspect
    )) FILTER (WHERE fs.id IS NOT NULL),
    '[]'::json
  ) AS sentiments,
  
  -- Cluster IDs
  COALESCE(ARRAY_AGG(DISTINCT fc.id) FILTER (WHERE fc.id IS NOT NULL), '{}') AS cluster_ids

FROM feedback_items fi
LEFT JOIN feedback_product_areas fpa ON fi.id = fpa.feedback_item_id
LEFT JOIN product_areas pa ON fpa.product_area_id = pa.id
LEFT JOIN feedback_features ff ON fi.id = ff.feedback_item_id
LEFT JOIN features f ON ff.feature_id = f.id
LEFT JOIN feedback_sentiments fs ON fi.id = fs.feedback_item_id
LEFT JOIN cluster_memberships cm ON fi.id = cm.feedback_item_id
LEFT JOIN feedback_clusters fc ON cm.cluster_id = fc.id
GROUP BY fi.id;
```

---

## 10. Implementation Checklist

### Phase 1: Pipeline Core (Week 1)
- [ ] Create LangGraph pipeline structure
- [ ] Implement all 5 nodes
- [ ] Set up progress streaming callback
- [ ] Test pipeline with sample CSV

### Phase 2: API & SSE (Week 2)
- [ ] Build upload endpoint with SSE
- [ ] Handle file storage and cleanup
- [ ] Implement progress event streaming
- [ ] Test with multiple concurrent uploads

### Phase 3: UI Components (Week 3)
- [ ] Build FeedbackUploadChat component
- [ ] Create InsightCard component
- [ ] Add FileUploadZone with drag-drop
- [ ] Implement real-time progress updates
- [ ] Build EvidenceModal for viewing feedback

### Phase 4: Integration & Polish (Week 4)
- [ ] Connect chat UI to pipeline API
- [ ] Add error handling and retries
- [ ] Implement chat context awareness
- [ ] Add ability to ask questions about insights
- [ ] Performance optimization

---

## 11. Success Metrics

### Technical
- **Processing Speed**: < 5 minutes for 500 feedback items
- **Accuracy**: > 85% correct product area tagging
- **Clustering Quality**: Silhouette score > 0.6
- **Uptime**: 99% successful pipeline completions

### User Experience
- **Upload Success**: > 95% successful uploads
- **Progress Visibility**: Real-time updates every 2 seconds
- **Insight Quality**: > 80% of insights actionable
- **Response Time**: Insights visible within 5 minutes

---

## 12. Future Enhancements

### Short-term
1. **Batch Processing**: Handle multiple CSV files simultaneously
2. **Scheduled Imports**: Auto-import from connected tools (Zendesk, Intercom)
3. **Custom Clustering**: Allow users to adjust clustering parameters
4. **Export Insights**: Download insights as PDF/CSV

### Long-term
1. **Real-time Streaming**: Process feedback as it arrives (webhooks)
2. **Multi-language Support**: Process feedback in any language
3. **Video/Audio Feedback**: Transcribe and process multimedia feedback
4. **Automated Actions**: Auto-create tickets, notify teams based on insights

---

## Next Steps

1. **Review this design document**
2. **Approve the LangGraph pipeline structure**
3. **Begin Phase 1 implementation** (pipeline nodes)
4. **Set up test data** (sample CSV files with real-ish feedback)
5. **Build MVP** (minimal chat + upload + basic insights)

Ready to start building? 🚀
