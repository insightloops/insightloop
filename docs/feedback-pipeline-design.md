# Feedback Processing Pipeline Design with LangGraph

## Overview
This document outlines the design for a feedback processing pipeline using LangGraph that takes CSV/JSON feedback data through multiple AI-powered stages: enrichment, clustering, insight generation, and scoring, with full UI progress reporting.

## Pipeline Architecture

### Core Flow
```
CSV/JSON Input → Feedback Enrichment → Semantic Clustering → Insight Generator → Insight Scorer → UI Dashboard
```

## 1. Data Input & Validation

### Input Formats
- **CSV Files**: Standard feedback exports with configurable column mapping
- **JSON Files**: Structured feedback objects with flexible schema
- **Required Fields**: text body, user ID, timestamp
- **Optional Fields**: tags, product area, segment info

### Input Schema
```typescript
interface FeedbackEntry {
  id: string;
  text: string;
  userId: string;
  timestamp: Date;
  source: 'survey' | 'support' | 'interview' | 'slack' | 'other';
  tags?: string[];
  userMetadata?: {
    plan: 'free' | 'pro' | 'enterprise';
    segment: string;
    teamSize: number;
    usage: 'low' | 'medium' | 'high';
  };
}

interface FeedbackBatch {
  id: string;
  entries: FeedbackEntry[];
  totalCount: number;
  dateRange: { start: Date; end: Date };
  sources: string[];
}
```

## 2. LangGraph Pipeline Design

### Graph Structure
```typescript
// Pipeline State
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

// Progress Tracking
interface PipelineProgress {
  stage: 'validation' | 'enrichment' | 'clustering' | 'insight-generation' | 'scoring' | 'complete';
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  startTime: Date;
  estimatedCompletion?: Date;
  processingRate?: number; // entries per second
}
```

### Graph Nodes

#### Node 1: Input Validation & Preprocessing
```typescript
async function validateInput(state: PipelineState): Promise<PipelineState> {
  // Validate required fields
  // Standardize data formats
  // Filter invalid entries
  // Update progress
  return {
    ...state,
    progress: {
      ...state.progress,
      stage: 'validation',
      currentStep: 'Validating input data',
      completedSteps: 1
    }
  };
}
```

#### Node 2: Feedback Enrichment Agent
```typescript
interface EnrichedFeedbackEntry extends FeedbackEntry {
  productArea: string;
  sentiment: {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
  };
  extractedFeatures: string[];
  urgency: 'low' | 'medium' | 'high';
  category: string[];
}

async function enrichFeedback(state: PipelineState): Promise<PipelineState> {
  const enrichmentAgent = new ChatWrapper(
    {
      provider: 'ollama',
      model: 'gpt-oss:20b',
      temperature: 0.3
    },
    {
      messages: [{
        role: 'system',
        content: `You are a feedback enrichment specialist. For each feedback entry, extract:
        1. Product area (onboarding, billing, features, support, etc.)
        2. Sentiment analysis with confidence score
        3. Mentioned features or modules
        4. Urgency level based on language used
        5. Category tags for classification
        
        Return structured JSON with your analysis.`
      }]
    }
  );

  const enrichedEntries: EnrichedFeedbackEntry[] = [];
  const batchSize = 10; // Process in batches
  
  for (let i = 0; i < state.feedbackEntries.length; i += batchSize) {
    const batch = state.feedbackEntries.slice(i, i + batchSize);
    
    // Process batch with AI agent
    const enrichmentPrompt = `Analyze these feedback entries: ${JSON.stringify(batch)}`;
    const response = await enrichmentAgent.sendMessage(enrichmentPrompt);
    
    // Parse and validate response
    const batchResults = JSON.parse(response);
    enrichedEntries.push(...batchResults);
    
    // Update progress
    const progress = Math.floor(((i + batchSize) / state.feedbackEntries.length) * 100);
    // Emit progress event to UI
    emitProgressUpdate(state.batchId, {
      stage: 'enrichment',
      progress,
      currentStep: `Enriching feedback ${i + 1}-${Math.min(i + batchSize, state.feedbackEntries.length)} of ${state.feedbackEntries.length}`
    });
  }

  return {
    ...state,
    enrichedEntries,
    progress: {
      ...state.progress,
      stage: 'enrichment',
      completedSteps: 2
    }
  };
}
```

#### Node 3: Semantic Clustering Agent
```typescript
interface FeedbackCluster {
  id: string;
  theme: string;
  description: string;
  entries: EnrichedFeedbackEntry[];
  size: number;
  dominantSentiment: string;
  productAreas: string[];
  urgencyDistribution: Record<string, number>;
  userSegments: string[];
}

async function clusterFeedback(state: PipelineState): Promise<PipelineState> {
  const clusteringAgent = new ChatWrapper(
    {
      provider: 'ollama',
      model: 'gpt-oss:20b',
      temperature: 0.1 // Lower temperature for consistent clustering
    },
    {
      messages: [{
        role: 'system',
        content: `You are a semantic clustering expert. Group similar feedback entries based on:
        1. Core themes and topics
        2. Pain points mentioned
        3. Feature requests
        4. User journey stages
        
        Create meaningful clusters with clear themes. Each cluster should represent a distinct user concern or pattern.
        
        Return clusters as structured JSON with theme names, descriptions, and member entry IDs.`
      }]
    }
  );

  // Generate embeddings for semantic similarity
  const embeddings = await generateEmbeddings(state.enrichedEntries);
  
  // Use AI agent for intelligent clustering
  const clusteringPrompt = `
    Analyze these ${state.enrichedEntries.length} enriched feedback entries and group them into meaningful clusters.
    Consider sentiment, product areas, and core themes.
    
    Entries: ${JSON.stringify(state.enrichedEntries.map(e => ({
      id: e.id,
      text: e.text,
      productArea: e.productArea,
      sentiment: e.sentiment.label,
      category: e.category
    })))}
  `;

  const clusteringResponse = await clusteringAgent.sendMessage(clusteringPrompt);
  const clusters: FeedbackCluster[] = JSON.parse(clusteringResponse);

  // Enrich clusters with metadata
  const enrichedClusters = clusters.map(cluster => ({
    ...cluster,
    size: cluster.entries.length,
    dominantSentiment: calculateDominantSentiment(cluster.entries),
    productAreas: [...new Set(cluster.entries.map(e => e.productArea))],
    urgencyDistribution: calculateUrgencyDistribution(cluster.entries),
    userSegments: extractUserSegments(cluster.entries)
  }));

  return {
    ...state,
    clusters: enrichedClusters,
    progress: {
      ...state.progress,
      stage: 'clustering',
      completedSteps: 3
    }
  };
}
```

#### Node 4: Insight Generator Agent
```typescript
interface GeneratedInsight {
  id: string;
  clusterId: string;
  title: string;
  summary: string;
  painPoint: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userWants: string;
  affectedUsers: number;
  userSegments: string[];
  productAreas: string[];
  evidenceEntries: string[]; // Feedback entry IDs
  recommendedActions: string[];
  confidence: number;
}

async function generateInsights(state: PipelineState): Promise<PipelineState> {
  const insightAgent = new ChatWrapper(
    {
      provider: 'ollama',
      model: 'gpt-oss:20b',
      temperature: 0.5
    },
    {
      messages: [{
        role: 'system',
        content: `You are an expert business analyst specializing in customer feedback insights.

For each feedback cluster, generate a structured insight that includes:
1. Clear, actionable title
2. Summary of the common pain point
3. Severity assessment based on user impact and business risk
4. What users actually want or need
5. Recommended actions for the product team
6. Confidence level in your analysis

Focus on business impact and actionability. Consider user segments and product areas in your analysis.`
      }]
    }
  );

  const insights: GeneratedInsight[] = [];

  for (const cluster of state.clusters) {
    const insightPrompt = `
      Analyze this feedback cluster and generate a structured business insight:
      
      Cluster: ${cluster.theme}
      Description: ${cluster.description}
      Size: ${cluster.size} users
      Product Areas: ${cluster.productAreas.join(', ')}
      User Segments: ${cluster.userSegments.join(', ')}
      Dominant Sentiment: ${cluster.dominantSentiment}
      
      Sample Feedback Entries:
      ${cluster.entries.slice(0, 5).map(e => `- "${e.text}" (${e.sentiment.label}, ${e.productArea})`).join('\n')}
      
      Generate a comprehensive insight with severity assessment and recommendations.
    `;

    const response = await insightAgent.sendMessage(insightPrompt);
    const insight = JSON.parse(response);
    
    insights.push({
      ...insight,
      id: uuidv4(),
      clusterId: cluster.id,
      affectedUsers: cluster.size,
      userSegments: cluster.userSegments,
      productAreas: cluster.productAreas,
      evidenceEntries: cluster.entries.map(e => e.id)
    });

    // Update progress
    emitProgressUpdate(state.batchId, {
      stage: 'insight-generation',
      progress: Math.floor((insights.length / state.clusters.length) * 100),
      currentStep: `Generated insight ${insights.length} of ${state.clusters.length}`
    });
  }

  return {
    ...state,
    insights,
    progress: {
      ...state.progress,
      stage: 'insight-generation',
      completedSteps: 4
    }
  };
}
```

#### Node 5: Insight Scorer Agent
```typescript
interface ScoredInsight extends GeneratedInsight {
  score: number;
  scoreBreakdown: {
    volume: number;        // How many users (0-100)
    value: number;         // User value (plan, usage) (0-100)
    recency: number;       // How recent the feedback (0-100)
    strategic: number;     // Alignment with OKRs (0-100)
    urgency: number;       // Severity and urgency (0-100)
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  businessImpact: string;
}

async function scoreInsights(state: PipelineState): Promise<PipelineState> {
  const scoringAgent = new ChatWrapper(
    {
      provider: 'ollama',
      model: 'gpt-oss:20b',
      temperature: 0.2
    },
    {
      messages: [{
        role: 'system',
        content: `You are a business prioritization expert. Score insights based on:

1. Volume (0-100): Number of affected users
2. Value (0-100): Customer value (Pro plans, high usage, enterprise)
3. Recency (0-100): How recent the feedback signals are
4. Strategic (0-100): Alignment with company OKRs and product strategy
5. Urgency (0-100): Severity of the pain point and business risk

Provide detailed scoring rationale and priority classification.`
      }]
    }
  );

  const scoredInsights: ScoredInsight[] = [];

  for (const insight of state.insights) {
    // Calculate base metrics
    const volumeScore = Math.min((insight.affectedUsers / state.feedbackEntries.length) * 100, 100);
    const recentFeedback = insight.evidenceEntries.length; // Simplified recency calculation
    
    const scoringPrompt = `
      Score this business insight for prioritization:
      
      Insight: ${insight.title}
      Summary: ${insight.summary}
      Severity: ${insight.severity}
      Affected Users: ${insight.affectedUsers}
      User Segments: ${insight.userSegments.join(', ')}
      Product Areas: ${insight.productAreas.join(', ')}
      
      Base Metrics:
      - Volume Score: ${volumeScore}
      - Recent Feedback Count: ${recentFeedback}
      
      Provide detailed scoring breakdown and priority classification.
    `;

    const response = await scoringAgent.sendMessage(scoringPrompt);
    const scoringResult = JSON.parse(response);
    
    const totalScore = (
      scoringResult.scoreBreakdown.volume * 0.25 +
      scoringResult.scoreBreakdown.value * 0.20 +
      scoringResult.scoreBreakdown.recency * 0.15 +
      scoringResult.scoreBreakdown.strategic * 0.25 +
      scoringResult.scoreBreakdown.urgency * 0.15
    );

    scoredInsights.push({
      ...insight,
      ...scoringResult,
      score: totalScore
    });
  }

  // Sort by score descending
  scoredInsights.sort((a, b) => b.score - a.score);

  return {
    ...state,
    scoredInsights,
    progress: {
      ...state.progress,
      stage: 'complete',
      completedSteps: 5
    }
  };
}
```

## 3. Progress Reporting System

### Real-time Progress Updates
```typescript
interface ProgressUpdate {
  batchId: string;
  stage: string;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: string;
  processingRate?: number;
  errors?: string[];
}

// SSE endpoint for real-time updates
export async function* streamPipelineProgress(batchId: string) {
  const eventEmitter = getPipelineEventEmitter(batchId);
  
  for await (const progress of eventEmitter) {
    yield {
      event: 'progress',
      data: JSON.stringify(progress)
    };
  }
}

// Progress emission helper
function emitProgressUpdate(batchId: string, update: Partial<ProgressUpdate>) {
  const eventEmitter = getPipelineEventEmitter(batchId);
  eventEmitter.emit('progress', update);
  
  // Also store in database for recovery
  storePipelineProgress(batchId, update);
}
```

### UI Dashboard Components
```typescript
// Progress visualization component
interface PipelineProgressProps {
  batchId: string;
}

export function PipelineProgress({ batchId }: PipelineProgressProps) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/pipeline/${batchId}/progress`);
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setProgress(update);
    };
    
    return () => eventSource.close();
  }, [batchId]);

  return (
    <div className="pipeline-progress">
      <div className="stage-indicators">
        {stages.map(stage => (
          <StageIndicator 
            key={stage} 
            stage={stage} 
            active={progress?.stage === stage}
            completed={isStageCompleted(stage, progress)}
          />
        ))}
      </div>
      
      <div className="current-progress">
        <ProgressBar value={progress?.progress || 0} />
        <p>{progress?.currentStep}</p>
        {progress?.estimatedTimeRemaining && (
          <p>Est. {progress.estimatedTimeRemaining} remaining</p>
        )}
      </div>
    </div>
  );
}
```

## 4. Error Handling & Recovery

### Error Types
```typescript
interface PipelineError {
  id: string;
  stage: string;
  type: 'validation' | 'ai_error' | 'processing' | 'timeout';
  message: string;
  details: any;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
}
```

### Recovery Strategies
- **Automatic Retry**: For transient AI model errors
- **Partial Processing**: Continue with successful entries, flag failures
- **Checkpoint Recovery**: Resume from last successful stage
- **Manual Intervention**: Alert operators for critical failures

## 5. Performance Optimization

### Batch Processing
- Process feedback in configurable batch sizes (default: 10 entries)
- Parallel processing where possible (e.g., independent enrichment)
- Rate limiting for AI model calls

### Caching Strategy
- Cache AI model responses for similar feedback text
- Store embedding vectors for reuse in clustering
- Cache insight templates for similar cluster patterns

### Resource Management
- Monitor AI model usage and costs
- Implement circuit breakers for model failures
- Queue management for high-volume processing

## 6. Implementation Timeline

### Phase 1: Core Pipeline (2 weeks)
- [ ] LangGraph pipeline structure
- [ ] Input validation and preprocessing
- [ ] Basic enrichment agent
- [ ] Progress reporting system

### Phase 2: Advanced Processing (2 weeks)
- [ ] Semantic clustering implementation
- [ ] Insight generation agent
- [ ] Scoring algorithm
- [ ] Error handling and recovery

### Phase 3: UI Integration (1 week)
- [ ] Real-time progress dashboard
- [ ] Results visualization
- [ ] Manual review interface
- [ ] Export functionality

### Phase 4: Optimization (1 week)
- [ ] Performance tuning
- [ ] Caching implementation
- [ ] Batch size optimization
- [ ] Cost monitoring

## 7. Success Metrics

### Processing Accuracy
- [ ] 95%+ successful feedback enrichment
- [ ] Meaningful clustering validated by domain experts
- [ ] Insight relevance score > 80%
- [ ] Score correlation with business priorities

### Performance
- [ ] Process 1000 feedback entries in < 10 minutes
- [ ] Real-time progress updates with < 1s latency
- [ ] 99.9% pipeline completion rate
- [ ] < 2% error rate with automatic recovery

### Business Impact
- [ ] Insights directly actionable by product teams
- [ ] 50% reduction in manual feedback analysis time
- [ ] Improved priority alignment with business objectives
- [ ] Clear ROI through faster insight-to-action cycles
