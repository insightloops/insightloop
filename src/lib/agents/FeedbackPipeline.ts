import { StateGraph, END } from "@langchain/langgraph";
import { ChatWrapper } from "@/lib/chat/ChatWrapper";
import { v4 as uuidv4 } from 'uuid';

// Pipeline State Interface
interface PipelineState {
  batchId: string;
  feedbackEntries: FeedbackEntry[];
  enrichedEntries: EnrichedFeedbackEntry[];
  clusters: FeedbackCluster[];
  insights: GeneratedInsight[];
  scoredInsights: ScoredInsight[];
  progress: PipelineProgress;
  errors: PipelineError[];
  metadata: {
    startTime: Date;
    totalEntries: number;
    processedEntries: number;
  };
}

// Main Pipeline Class
export class FeedbackPipeline {
  private graph: StateGraph<PipelineState>;
  private chatWrapper: ChatWrapper;

  constructor() {
    // Initialize ChatWrapper with optimal settings for batch processing
    this.chatWrapper = new ChatWrapper(
      {
        provider: 'ollama',
        model: 'gpt-oss:20b',
        baseUrl: 'http://localhost:11435',
        temperature: 0.3,
        maxTokens: 4096
      },
      {
        messages: [{
          role: 'system',
          content: 'You are an expert feedback analysis system. Process feedback data with precision and structure.'
        }]
      }
    );

    this.buildGraph();
  }

  private buildGraph() {
    this.graph = new StateGraph<PipelineState>({
      channels: {
        batchId: { default: () => "" },
        feedbackEntries: { default: () => [] },
        enrichedEntries: { default: () => [] },
        clusters: { default: () => [] },
        insights: { default: () => [] },
        scoredInsights: { default: () => [] },
        progress: { 
          default: () => ({
            stage: 'validation',
            currentStep: 'Starting pipeline',
            totalSteps: 5,
            completedSteps: 0,
            startTime: new Date()
          })
        },
        errors: { default: () => [] },
        metadata: {
          default: () => ({
            startTime: new Date(),
            totalEntries: 0,
            processedEntries: 0
          })
        }
      }
    });

    // Add nodes to the graph
    this.graph.addNode("validate_input", this.validateInput.bind(this));
    this.graph.addNode("enrich_feedback", this.enrichFeedback.bind(this));
    this.graph.addNode("cluster_feedback", this.clusterFeedback.bind(this));
    this.graph.addNode("generate_insights", this.generateInsights.bind(this));
    this.graph.addNode("score_insights", this.scoreInsights.bind(this));

    // Define the flow
    this.graph.addEdge("validate_input", "enrich_feedback");
    this.graph.addEdge("enrich_feedback", "cluster_feedback");
    this.graph.addEdge("cluster_feedback", "generate_insights");
    this.graph.addEdge("generate_insights", "score_insights");
    this.graph.addEdge("score_insights", END);

    // Set entry point
    this.graph.setEntryPoint("validate_input");
  }

  // Node 1: Input Validation
  private async validateInput(state: PipelineState): Promise<Partial<PipelineState>> {
    console.log(`[${state.batchId}] Starting input validation...`);
    
    // Emit progress update
    this.emitProgress(state.batchId, {
      stage: 'validation',
      currentStep: 'Validating input data structure',
      progress: 10
    });

    // Validate required fields
    const validEntries = state.feedbackEntries.filter(entry => 
      entry.text && entry.text.trim().length > 0 &&
      entry.userId && 
      entry.timestamp
    );

    if (validEntries.length === 0) {
      throw new Error('No valid feedback entries found');
    }

    console.log(`[${state.batchId}] Validated ${validEntries.length}/${state.feedbackEntries.length} entries`);

    return {
      feedbackEntries: validEntries,
      progress: {
        ...state.progress,
        stage: 'validation',
        currentStep: `Validated ${validEntries.length} feedback entries`,
        completedSteps: 1,
        progress: 20
      },
      metadata: {
        ...state.metadata,
        totalEntries: validEntries.length
      }
    };
  }

  // Node 2: Feedback Enrichment
  private async enrichFeedback(state: PipelineState): Promise<Partial<PipelineState>> {
    console.log(`[${state.batchId}] Starting feedback enrichment...`);
    
    const enrichedEntries: EnrichedFeedbackEntry[] = [];
    const batchSize = 10;
    const totalBatches = Math.ceil(state.feedbackEntries.length / batchSize);

    for (let i = 0; i < state.feedbackEntries.length; i += batchSize) {
      const batch = state.feedbackEntries.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      this.emitProgress(state.batchId, {
        stage: 'enrichment',
        currentStep: `Processing batch ${batchNumber}/${totalBatches}`,
        progress: 20 + Math.floor((batchNumber / totalBatches) * 30)
      });

      try {
        // Create enrichment prompt
        const enrichmentPrompt = `
Analyze these feedback entries and return a JSON array with enrichment data:

${batch.map((entry, idx) => `
${idx + 1}. ID: ${entry.id}
   Text: "${entry.text}"
   Source: ${entry.source}
   User: ${entry.userId}
`).join('\n')}

For each entry, return:
{
  "id": "original_id",
  "productArea": "onboarding|billing|features|support|other",
  "sentiment": {
    "label": "positive|negative|neutral",
    "score": -1 to 1,
    "confidence": 0 to 1
  },
  "extractedFeatures": ["feature1", "feature2"],
  "urgency": "low|medium|high",
  "category": ["category1", "category2"]
}

Return only the JSON array, no other text.
        `;

        const response = await this.chatWrapper.sendMessage(enrichmentPrompt);
        
        // Parse AI response
        let batchResults;
        try {
          // Clean response and parse JSON
          const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
          batchResults = JSON.parse(cleanResponse);
        } catch (parseError) {
          console.error(`[${state.batchId}] Failed to parse enrichment response:`, parseError);
          // Fallback: create basic enrichment
          batchResults = batch.map(entry => ({
            id: entry.id,
            productArea: 'other',
            sentiment: { label: 'neutral', score: 0, confidence: 0.5 },
            extractedFeatures: [],
            urgency: 'medium',
            category: ['uncategorized']
          }));
        }

        // Merge with original entries
        const enrichedBatch = batch.map(entry => {
          const enrichment = batchResults.find((r: any) => r.id === entry.id) || batchResults[0];
          return {
            ...entry,
            ...enrichment
          };
        });

        enrichedEntries.push(...enrichedBatch);
        
        console.log(`[${state.batchId}] Enriched batch ${batchNumber}/${totalBatches}`);

      } catch (error) {
        console.error(`[${state.batchId}] Error enriching batch ${batchNumber}:`, error);
        
        // Add basic enrichment for failed batch
        const fallbackBatch = batch.map(entry => ({
          ...entry,
          productArea: 'other',
          sentiment: { label: 'neutral', score: 0, confidence: 0.5 },
          extractedFeatures: [],
          urgency: 'medium',
          category: ['processing_error']
        }));
        
        enrichedEntries.push(...fallbackBatch);
      }
    }

    console.log(`[${state.batchId}] Completed enrichment: ${enrichedEntries.length} entries`);

    return {
      enrichedEntries,
      progress: {
        ...state.progress,
        stage: 'enrichment',
        currentStep: `Enriched ${enrichedEntries.length} feedback entries`,
        completedSteps: 2,
        progress: 50
      }
    };
  }

  // Node 3: Semantic Clustering
  private async clusterFeedback(state: PipelineState): Promise<Partial<PipelineState>> {
    console.log(`[${state.batchId}] Starting semantic clustering...`);
    
    this.emitProgress(state.batchId, {
      stage: 'clustering',
      currentStep: 'Analyzing feedback themes',
      progress: 55
    });

    try {
      // Prepare clustering prompt
      const clusteringPrompt = `
Analyze these enriched feedback entries and group them into meaningful clusters based on themes:

${state.enrichedEntries.map((entry, idx) => `
${idx + 1}. "${entry.text}"
   - Product Area: ${entry.productArea}
   - Sentiment: ${entry.sentiment.label}
   - Categories: ${entry.category.join(', ')}
`).join('\n')}

Create 3-8 meaningful clusters. For each cluster, return:
{
  "id": "cluster_1",
  "theme": "Clear theme name",
  "description": "What this cluster represents",
  "entryIds": ["id1", "id2", "id3"],
  "dominantSentiment": "positive|negative|neutral",
  "productAreas": ["area1", "area2"],
  "keywords": ["keyword1", "keyword2"]
}

Return JSON array of clusters only.
      `;

      const response = await this.chatWrapper.sendMessage(clusteringPrompt);
      
      // Parse clustering response
      let clusters;
      try {
        const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        clusters = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error(`[${state.batchId}] Failed to parse clustering response:`, parseError);
        // Fallback: create single cluster
        clusters = [{
          id: 'cluster_1',
          theme: 'Mixed Feedback',
          description: 'Various feedback topics',
          entryIds: state.enrichedEntries.map(e => e.id),
          dominantSentiment: 'neutral',
          productAreas: ['mixed'],
          keywords: ['feedback']
        }];
      }

      // Enrich clusters with actual entries and metadata
      const enrichedClusters = clusters.map((cluster: any) => {
        const entries = state.enrichedEntries.filter(entry => 
          cluster.entryIds.includes(entry.id)
        );

        return {
          ...cluster,
          entries,
          size: entries.length,
          urgencyDistribution: this.calculateUrgencyDistribution(entries),
          userSegments: this.extractUserSegments(entries)
        };
      });

      console.log(`[${state.batchId}] Created ${enrichedClusters.length} clusters`);

      return {
        clusters: enrichedClusters,
        progress: {
          ...state.progress,
          stage: 'clustering',
          currentStep: `Created ${enrichedClusters.length} feedback clusters`,
          completedSteps: 3,
          progress: 70
        }
      };

    } catch (error) {
      console.error(`[${state.batchId}] Clustering error:`, error);
      throw error;
    }
  }

  // Node 4: Generate Insights
  private async generateInsights(state: PipelineState): Promise<Partial<PipelineState>> {
    console.log(`[${state.batchId}] Generating insights...`);
    
    const insights: GeneratedInsight[] = [];

    for (let i = 0; i < state.clusters.length; i++) {
      const cluster = state.clusters[i];
      
      this.emitProgress(state.batchId, {
        stage: 'insight-generation',
        currentStep: `Generating insight ${i + 1}/${state.clusters.length}`,
        progress: 70 + Math.floor((i / state.clusters.length) * 15)
      });

      try {
        const insightPrompt = `
Generate a business insight for this feedback cluster:

Cluster: ${cluster.theme}
Description: ${cluster.description}
Size: ${cluster.size} feedback entries
Dominant Sentiment: ${cluster.dominantSentiment}
Product Areas: ${cluster.productAreas.join(', ')}

Sample feedback:
${cluster.entries.slice(0, 3).map(e => `- "${e.text}"`).join('\n')}

Return JSON:
{
  "title": "Clear, actionable insight title",
  "summary": "Brief summary of the pattern",
  "painPoint": "Core user pain point",
  "severity": "low|medium|high|critical",
  "userWants": "What users actually want",
  "recommendedActions": ["action1", "action2"],
  "confidence": 0.8
}
        `;

        const response = await this.chatWrapper.sendMessage(insightPrompt);
        
        // Parse insight response
        let insight;
        try {
          const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
          insight = JSON.parse(cleanResponse);
        } catch (parseError) {
          console.error(`[${state.batchId}] Failed to parse insight response:`, parseError);
          insight = {
            title: `Insight: ${cluster.theme}`,
            summary: cluster.description,
            painPoint: 'User feedback analysis needed',
            severity: 'medium',
            userWants: 'Improved experience',
            recommendedActions: ['Review feedback cluster'],
            confidence: 0.5
          };
        }

        insights.push({
          ...insight,
          id: uuidv4(),
          clusterId: cluster.id,
          affectedUsers: cluster.size,
          userSegments: cluster.userSegments,
          productAreas: cluster.productAreas,
          evidenceEntries: cluster.entries.map(e => e.id)
        });

      } catch (error) {
        console.error(`[${state.batchId}] Error generating insight for cluster ${cluster.id}:`, error);
      }
    }

    console.log(`[${state.batchId}] Generated ${insights.length} insights`);

    return {
      insights,
      progress: {
        ...state.progress,
        stage: 'insight-generation',
        currentStep: `Generated ${insights.length} business insights`,
        completedSteps: 4,
        progress: 85
      }
    };
  }

  // Node 5: Score Insights
  private async scoreInsights(state: PipelineState): Promise<Partial<PipelineState>> {
    console.log(`[${state.batchId}] Scoring insights...`);
    
    this.emitProgress(state.batchId, {
      stage: 'scoring',
      currentStep: 'Calculating insight scores',
      progress: 90
    });

    const scoredInsights: ScoredInsight[] = [];

    for (const insight of state.insights) {
      // Calculate scoring components
      const volumeScore = Math.min((insight.affectedUsers / state.metadata.totalEntries) * 100, 100);
      const severityScore = {
        'low': 25,
        'medium': 50,
        'high': 75,
        'critical': 100
      }[insight.severity] || 50;

      // Simple scoring algorithm (can be enhanced with AI)
      const scoreBreakdown = {
        volume: volumeScore,
        value: 70, // Default user value score
        recency: 80, // Default recency score
        strategic: 60, // Default strategic alignment
        urgency: severityScore
      };

      const totalScore = 
        scoreBreakdown.volume * 0.25 +
        scoreBreakdown.value * 0.20 +
        scoreBreakdown.recency * 0.15 +
        scoreBreakdown.strategic * 0.25 +
        scoreBreakdown.urgency * 0.15;

      const priority = totalScore >= 80 ? 'critical' :
                      totalScore >= 65 ? 'high' :
                      totalScore >= 45 ? 'medium' : 'low';

      scoredInsights.push({
        ...insight,
        score: Math.round(totalScore),
        scoreBreakdown,
        priority,
        businessImpact: `Impact score: ${Math.round(totalScore)}/100`
      });
    }

    // Sort by score descending
    scoredInsights.sort((a, b) => b.score - a.score);

    console.log(`[${state.batchId}] Scored and ranked ${scoredInsights.length} insights`);

    return {
      scoredInsights,
      progress: {
        ...state.progress,
        stage: 'complete',
        currentStep: `Pipeline complete: ${scoredInsights.length} insights generated`,
        completedSteps: 5,
        progress: 100
      }
    };
  }

  // Helper methods
  private calculateUrgencyDistribution(entries: EnrichedFeedbackEntry[]) {
    const distribution = { low: 0, medium: 0, high: 0 };
    entries.forEach(entry => {
      distribution[entry.urgency]++;
    });
    return distribution;
  }

  private extractUserSegments(entries: EnrichedFeedbackEntry[]) {
    const segments = new Set<string>();
    entries.forEach(entry => {
      if (entry.userMetadata?.segment) {
        segments.add(entry.userMetadata.segment);
      }
    });
    return Array.from(segments);
  }

  private emitProgress(batchId: string, update: Partial<PipelineProgress>) {
    // Emit to UI via WebSocket or SSE
    console.log(`[${batchId}] Progress:`, update);
    // In real implementation, emit to event system
  }

  // Public method to run the pipeline
  async processFeedback(feedbackEntries: FeedbackEntry[]): Promise<ScoredInsight[]> {
    const batchId = uuidv4();
    
    console.log(`[${batchId}] Starting feedback pipeline with ${feedbackEntries.length} entries`);

    const initialState: PipelineState = {
      batchId,
      feedbackEntries,
      enrichedEntries: [],
      clusters: [],
      insights: [],
      scoredInsights: [],
      progress: {
        stage: 'validation',
        currentStep: 'Starting pipeline',
        totalSteps: 5,
        completedSteps: 0,
        startTime: new Date()
      },
      errors: [],
      metadata: {
        startTime: new Date(),
        totalEntries: feedbackEntries.length,
        processedEntries: 0
      }
    };

    try {
      const result = await this.graph.invoke(initialState);
      
      console.log(`[${batchId}] Pipeline completed successfully`);
      console.log(`[${batchId}] Generated ${result.scoredInsights.length} scored insights`);
      
      return result.scoredInsights;

    } catch (error) {
      console.error(`[${batchId}] Pipeline failed:`, error);
      throw error;
    }
  }
}

// Export types for use in API
export type { 
  PipelineState, 
  FeedbackEntry, 
  EnrichedFeedbackEntry, 
  FeedbackCluster, 
  GeneratedInsight, 
  ScoredInsight,
  PipelineProgress 
};
