# AI Playground Integration Guide

This guide shows how to integrate the new AI Playground components into your pipeline UI.

## Overview

The new AI enrichment UI consolidates the feedback processing view by:

1. **Removing duplicate lists** - No more showing raw feedback list + enriched feedback list
2. **Streamlined enrichment view** - Shows enriched feedback as they arrive in real-time
3. **Interactive AI playground** - Click on any enriched feedback to explore the AI processing details
4. **Experimental capabilities** - Modify prompts, tools, and models to test different approaches

## Components

### 1. AIPlayground Component

A full-featured AI playground that allows:
- **Setup Tab**: Configure model, messages, and tools
- **Response Tab**: View AI response with metadata and token usage
- **Raw Data Tab**: See the complete JSON for debugging

```tsx
import { AIPlayground } from '@/components/AIPlayground'

<AIPlayground
  isOpen={playgroundOpen}
  onClose={() => setPlaygroundOpen(false)}
  initialCallData={callData}
  title="AI Playground - Feedback Analysis"
  description="Explore and experiment with the AI enrichment process"
/>
```

### 2. AIEnrichmentView Component

Replaces the old enrichment section with:
- **Real-time progress** - Shows processing stats and progress
- **Enriched feedback cards** - Display results as they arrive
- **Playground integration** - Click "Playground" button to experiment

```tsx
import { AIEnrichmentView } from '@/components/AIEnrichmentView'

<AIEnrichmentView
  isRunning={isEnrichmentRunning}
  progress={enrichmentProgress}
  enrichedFeedback={enrichedFeedbackItems}
  totalFeedback={totalFeedbackCount}
  processedCount={processedFeedbackCount}
/>
```

### 3. UpdatedPipelineView Component

Complete pipeline view with tabbed interface:
- **Stage navigation** - Switch between Enrichment, Clustering, Insights
- **Progress tracking** - Visual progress for each stage
- **Integrated components** - Uses AIEnrichmentView for enrichment stage

```tsx
import { UpdatedPipelineView } from '@/components/UpdatedPipelineView'

<UpdatedPipelineView
  stages={stages}
  enrichedFeedback={enrichedFeedback}
  enrichedClusters={enrichedClusters}
  events={events}
  expandedSections={expandedSections}
  onToggleSection={handleToggleSection}
  onViewFeedback={handleViewFeedback}
  onViewCluster={handleViewCluster}
  getSentimentColor={getSentimentColor}
  stageProgress={stageProgress}
  progressStats={progressStats}
/>
```

## Key Features

### AI Playground Features

1. **Model Selection**: Choose from multiple AI models
2. **Message Editor**: Add/edit/remove messages in the conversation
3. **Tool Configuration**: View and modify available tools
4. **Interactive Experimentation**: Change prompts and re-run
5. **Response Analysis**: Detailed view of AI responses
6. **Token Usage Tracking**: Monitor prompt and completion tokens
7. **Raw Data Export**: Copy complete JSON for debugging

### Enrichment View Features

1. **Consolidated Display**: Single list showing enriched feedback only
2. **Real-time Updates**: Cards appear as enrichment completes
3. **Rich Metadata**: Shows sentiment, urgency, features, product areas
4. **AI Call Details**: Display call ID, duration, message count
5. **Playground Integration**: One-click access to experiment with the AI call
6. **Progress Tracking**: Visual progress bar and statistics

### Pipeline Integration

1. **Tabbed Interface**: Easy navigation between pipeline stages
2. **Stage-specific Views**: Tailored UI for each processing stage
3. **Progress Visualization**: Clear progress indicators for each stage
4. **Interactive Elements**: Click to drill down into details

## Data Flow

```typescript
// 1. Original feedback gets processed
const feedback = {
  id: 'feedback-123',
  text: 'The login system is too slow...',
  source: 'user_survey'
}

// 2. AI enrichment produces structured data
const enrichedFeedback: EnrichedFeedback = {
  id: 'enriched-123',
  originalFeedback: feedback,
  enrichmentData: {
    sentiment: { label: 'negative', score: -0.7, confidence: 0.89 },
    extractedFeatures: ['login', 'performance', 'speed'],
    urgency: 'high',
    category: ['technical', 'user_experience'],
    linkedProductAreas: [{ id: 'auth', confidence: 0.92 }]
  },
  aiCallDetails: {
    callId: 'call-456',
    input: { messages: [...] },
    output: { extractedData: {...} },
    duration: 1250
  }
}

// 3. Playground can recreate and experiment with the AI call
const playgroundData = {
  callId: 'call-456',
  model: 'gpt-4-turbo-preview',
  messages: [...enrichedFeedback.aiCallDetails.input.messages],
  tools: [...availableTools],
  response: {...mockOrActualResponse}
}
```

## Integration Steps

1. **Replace existing enrichment UI** with `AIEnrichmentView`
2. **Add AI playground modal** to your page/component
3. **Update pipeline components** to use the new tabbed interface
4. **Connect event handlers** for playground opening and data passing
5. **Style integration** to match your design system

## Benefits

1. **Reduced Complexity**: No more duplicate lists and confusing UI
2. **Better UX**: Streamlined flow from processing to experimentation
3. **Debugging Capabilities**: Full visibility into AI processing
4. **Experimentation**: Easy to test different prompts and approaches
5. **Real-time Feedback**: See results as they happen
6. **Developer Friendly**: Raw data access for debugging

## Example Usage

```tsx
'use client'

import React, { useState } from 'react'
import { AIEnrichmentView } from '@/components/AIEnrichmentView'
import { usePipelineExecution } from '@/hooks/usePipelineExecution'

export function PipelinePage() {
  const {
    isExecuting,
    enrichedFeedback,
    stageProgress,
    progressStats
  } = usePipelineExecution()

  return (
    <div className="container mx-auto py-8">
      <AIEnrichmentView
        isRunning={isExecuting}
        progress={stageProgress.enrichment}
        enrichedFeedback={enrichedFeedback}
        totalFeedback={progressStats.totalFeedback}
        processedCount={progressStats.feedbackProcessed}
      />
    </div>
  )
}
```

This new architecture provides a much cleaner, more intuitive experience for monitoring and experimenting with AI-powered feedback enrichment.
