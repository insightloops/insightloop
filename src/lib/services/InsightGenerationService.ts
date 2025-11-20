/**
 * AI-Driven Insight Generation Service
 * 
 * Transforms semantic clusters into actionable business insights with
 * complete auditability, evidence tracking, and strategic recommendations.
 */

import { ChatWrapper } from '@/lib/chat/ChatWrapper'
import { FeedbackCluster } from './SemanticClusteringService'
import { EnrichedFeedbackEntry } from './FeedbackEnrichmentService'
import { PipelineEventEmitter } from '@/types/pipeline-event-types'
import { extractJson } from '@/lib/utils/json-extractor'
import { insightGenerationTool } from '@/lib/tools/insight-tools'
import { processInParallel, createProgressLogger } from '@/lib/utils/parallel-processor'

// Core insight and evidence types
export interface GeneratedInsight {
  id: string
  clusterId: string
  
  // Core Insight Content
  title: string
  executiveSummary: string
  detailedAnalysis: string
  
  // Pain Point Analysis
  painPoint: {
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    userJourneyStage: string
    frequencyOfMention: number
  }
  
  // Impact Assessment
  impact: {
    usersAffected: number
    userSegments: string[]
    businessImpact: {
      revenue: 'positive' | 'negative' | 'neutral'
      churn: 'increase' | 'decrease' | 'neutral'
      satisfaction: 'improve' | 'decline' | 'maintain'
    }
    quantifiedEstimates: Array<{
      metric: string
      estimatedChange: string
      confidence: number
    }>
  }
  
  // Strategic Recommendations
  recommendations: RecommendedAction[]
  
  // Complete Evidence Chain
  evidence: EvidenceChain
  confidence: number
  
  // Multi-Stakeholder Formats
  stakeholderFormats: {
    executive: string
    product: string
    engineering: string
    customerSuccess: string
  }
  
  // Metadata
  generatedAt: Date
  processingTimeMs: number
}

export interface RecommendedAction {
  id: string
  title: string
  description: string
  category: 'bug-fix' | 'enhancement' | 'new-feature' | 'process-improvement'
  priority: 'critical' | 'high' | 'medium' | 'low'
  effort: 'small' | 'medium' | 'large' | 'extra-large'
  timeline: string
  successMetrics: string[]
}

export interface EvidenceChain {
  sourceCluster: {
    id: string
    theme: string
    size: number
    confidence: number
  }
  supportingFeedback: Array<{
    feedbackId: string
    text: string
    userSegment: string
    relevanceScore: number
    quoteExtract: string
  }>
  derivationPath: {
    analysisMethod: string
    aiReasoningSteps: string[]
    confidenceFactors: string[]
  }
}

export interface InsightGenerationConfig {
  analysisDepth: 'surface' | 'detailed' | 'comprehensive'
  stakeholderFocus: 'product' | 'engineering' | 'leadership' | 'customer-success'
  recommendationStyle: 'tactical' | 'strategic' | 'balanced'
  qualityThreshold: number
  maxRecommendations: number
}

/**
 * Primary service for generating AI-driven insights from semantic clusters
 */
interface APIKeys {
  openai?: string
  anthropic?: string
}

export class InsightGenerationService {
  private insightAgent!: ChatWrapper
  private config: InsightGenerationConfig
  private eventEmitter: PipelineEventEmitter
  private pipelineId: string
  private apiKeys: APIKeys

  constructor(
    eventEmitter: PipelineEventEmitter,
    pipelineId: string,
    config?: Partial<InsightGenerationConfig>,
    apiKeys?: APIKeys
  ) {
    this.eventEmitter = eventEmitter
    this.pipelineId = pipelineId
    this.apiKeys = apiKeys || {}
    this.config = {
      analysisDepth: 'comprehensive',
      stakeholderFocus: 'product',
      recommendationStyle: 'balanced',
      qualityThreshold: 0.7,
      maxRecommendations: 5,
      ...config
    }
    this.initializeInsightAgent()
  }

  private initializeInsightAgent() {
    this.insightAgent = new ChatWrapper(
      {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: this.apiKeys.openai, // Use user's API key if provided
        temperature: 0.2  // Balanced creativity and consistency
      },
      {
        messages: [{
          role: 'system',
          content: `You are a Senior Product Analyst with expertise in user research, product strategy, and evidence-based decision making. 

Your role is to analyze customer feedback clusters and generate actionable business insights that help product teams make data-driven decisions.

Core Principles:
- Evidence-Based Analysis: Every claim must be supported by specific feedback entries
- Business Impact Focus: Quantify impact on users, revenue, churn, and satisfaction
- Actionable Recommendations: Provide specific, prioritized next steps with effort estimates
- Multi-Stakeholder Communication: Consider different audience needs (executives, product, engineering, customer success)

Analysis Framework:
- Use Jobs-to-be-Done methodology to understand user intent
- Apply Impact/Effort prioritization for recommendations
- Focus on root cause analysis, not just symptoms
- Provide confidence levels for all estimates

Quality Standards:
- Specific, actionable insights (not generic observations)
- Clear evidence chain from feedback to recommendations
- Realistic effort and timeline estimates
- Measurable success criteria

Always use the insight generation tool to return structured results.`
        }],
        tools: [insightGenerationTool]
      }
    )
  }

  /**
   * Generate insights from semantic clusters
   */
  async generateInsights(
    clusters: FeedbackCluster[],
    pipelineId: string
  ): Promise<GeneratedInsight[]> {
    const startTime = Date.now()
    console.log(`🎯 Starting parallel insight generation for ${clusters.length} clusters`)
    
    // Emit start event
    this.eventEmitter.emit('insight_generation_started', {
      pipelineId,
      timestamp: new Date().toISOString(),
      clusterCount: clusters.length,
      mode: 'parallel'
    })

    // Create progress logger
    const progressLogger = createProgressLogger('Insight Generation')

    // Process clusters in parallel
    const processingResult = await processInParallel(
      clusters,
      async (cluster: FeedbackCluster) => {
        console.log(`📊 Processing cluster: ${cluster.theme} (${cluster.entries.length} items)`)
        
        const insight = await this.generateSingleInsight(cluster)
        
        if (!insight) {
          throw new Error(`Failed to generate insight for cluster ${cluster.id}`)
        }
        
        // Emit insight created event
        this.eventEmitter.emit('insight_created', {
          pipelineId,
          timestamp: new Date().toISOString(),
          insightId: insight.id,
          clusterId: cluster.id,
          title: insight.title,
          summary: insight.executiveSummary,
          severity: 'medium', // Default severity since it's not in the insight structure
          confidence: insight.confidence,
          usersAffected: cluster.entries.length, // Use cluster size as proxy for users affected
          recommendationCount: insight.recommendations.length,
          evidenceCount: insight.evidence.supportingFeedback.length,
          stakeholderFormats: Object.keys(insight.stakeholderFormats || {})
        })

        return insight
      },
      {
        concurrency: 3, // Conservative for OpenAI rate limits
        continueOnError: true,
        onBatchComplete: progressLogger.onBatchComplete,
        onItemComplete: progressLogger.onItemComplete
      }
    )

    // Extract successful insights
    const insights = processingResult.results
      .filter(result => result.success && result.result)
      .map(result => result.result!)

    const duration = Date.now() - startTime
    console.log(`✅ Generated ${insights.length} insights from ${clusters.length} clusters in ${duration}ms`)
    console.log(`📊 Processing stats: ${processingResult.stats.successCount}/${processingResult.stats.totalItems} successful, ${processingResult.stats.throughput.toFixed(1)} items/sec`)
    
    // Emit completion event
    this.eventEmitter.emit('insight_generation_complete', {
      pipelineId,
      timestamp: new Date().toISOString(),
      insightCount: insights.length,
      duration
    })

    return insights
  }

  /**
   * Generate a single insight from a cluster
   */
  private async generateSingleInsight(
    cluster: FeedbackCluster
  ): Promise<GeneratedInsight | null> {
    const startTime = Date.now()
    const insightId = `insight_${cluster.id}_${Date.now()}`

    try {
      // Build evidence chain
      const evidenceChain = this.buildEvidenceChain(cluster)
      
      // Generate core insight with AI
      const coreInsight = await this.generateCoreInsight(cluster, evidenceChain)
      
      // Generate stakeholder formats
      const stakeholderFormats = this.generateStakeholderFormats(coreInsight, cluster)
      
      // Assemble complete insight
      const insight: GeneratedInsight = {
        id: insightId,
        clusterId: cluster.id,
        title: coreInsight.title,
        executiveSummary: coreInsight.executiveSummary,
        detailedAnalysis: coreInsight.detailedAnalysis,
        painPoint: coreInsight.painPoint,
        impact: coreInsight.impact,
        recommendations: coreInsight.recommendations.map((rec, idx) => ({
          id: `${insightId}_rec_${idx + 1}`,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          priority: rec.priority,
          effort: rec.effort,
          timeline: rec.timeline,
          successMetrics: rec.successMetrics
        })),
        evidence: evidenceChain,
        confidence: this.calculateConfidence(coreInsight, evidenceChain),
        stakeholderFormats,
        generatedAt: new Date(),
        processingTimeMs: Date.now() - startTime
      }

      return insight

    } catch (error) {
      console.error(`Failed to generate insight for cluster "${cluster.theme}":`, error)
      return null
    }
  }

  /**
   * Build evidence chain from cluster
   */
  private buildEvidenceChain(cluster: FeedbackCluster): EvidenceChain {
    const supportingFeedback = cluster.entries.map(entry => ({
      feedbackId: entry.id,
      text: entry.text,
      userSegment: entry.userMetadata?.segment || 'unknown',
      relevanceScore: 0.85, // Simplified for now
      quoteExtract: this.extractKeyQuote(entry.text)
    }))

    return {
      sourceCluster: {
        id: cluster.id,
        theme: cluster.theme,
        size: cluster.size,
        confidence: cluster.confidence
      },
      supportingFeedback,
      derivationPath: {
        analysisMethod: 'ai-semantic-clustering-v1',
        aiReasoningSteps: [
          'Semantic similarity analysis of feedback entries',
          'AI-powered theme extraction and labeling',
          'Evidence-based insight generation',
          'Impact assessment and recommendation prioritization'
        ],
        confidenceFactors: [
          `Cluster confidence: ${(cluster.confidence * 100).toFixed(1)}%`,
          `Sample size: ${cluster.size} feedback entries`,
          `Sentiment consistency: ${cluster.dominantSentiment}`,
          `Product area alignment: ${cluster.productAreas.join(', ')}`
        ]
      }
    }
  }

  /**
   * Extract key quote from feedback text
   */
  private extractKeyQuote(text: string): string {
    // Simple extraction - take first meaningful sentence or first 100 chars
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
    if (sentences.length > 0 && sentences[0].trim().length <= 120) {
      return sentences[0].trim()
    }
    return text.substring(0, 100) + (text.length > 100 ? '...' : '')
  }

  /**
   * Generate core insight using AI analysis
   */
  private async generateCoreInsight(
    cluster: FeedbackCluster,
    evidenceChain: EvidenceChain
  ): Promise<{
    title: string
    executiveSummary: string
    detailedAnalysis: string
    painPoint: GeneratedInsight['painPoint']
    impact: GeneratedInsight['impact']
    recommendations: Array<{
      title: string
      description: string
      category: 'bug-fix' | 'enhancement' | 'new-feature' | 'process-improvement'
      priority: 'critical' | 'high' | 'medium' | 'low'
      effort: 'small' | 'medium' | 'large' | 'extra-large'
      timeline: string
      successMetrics: string[]
    }>
  }> {
    
    const prompt = this.buildInsightGenerationPrompt(cluster, evidenceChain)
    
    try {
      const response = await this.insightAgent.sendMessage(prompt)
      
      // Parse insight from OpenAI function calling response
      const parsedInsight = this.parseInsightResponse(response, cluster)
      
      return parsedInsight

    } catch (error) {
      console.error('AI insight generation failed:', error)
      
      // Return fallback insight
      return this.createFallbackInsight(cluster, evidenceChain)
    }
  }

  /**
   * Build comprehensive AI prompt for insight generation
   */
  private buildInsightGenerationPrompt(
    cluster: FeedbackCluster,
    evidenceChain: EvidenceChain
  ): string {
    const feedbackContext = evidenceChain.supportingFeedback
      .slice(0, 5) // Limit to top 5 for prompt size
      .map((feedback, idx) => `
${idx + 1}. ID: ${feedback.feedbackId} (${feedback.userSegment})
   Text: "${feedback.text}"
   Key Quote: "${feedback.quoteExtract}"`)
      .join('\n')

    return `Analyze this customer feedback cluster and generate actionable business insights.

## Cluster Overview
**Theme**: ${cluster.theme}
**Description**: ${cluster.description}
**Size**: ${cluster.size} feedback entries
**Dominant Sentiment**: ${cluster.dominantSentiment}
**User Segments**: ${cluster.userSegments.join(', ')}
**Product Areas**: ${cluster.productAreas.join(', ')}
**Urgency Distribution**: High: ${cluster.urgencyDistribution.high}, Medium: ${cluster.urgencyDistribution.medium}, Low: ${cluster.urgencyDistribution.low}

## Supporting Feedback Evidence
${feedbackContext}

## Analysis Requirements

1. **Pain Point Identification**
   - What specific job are users trying to accomplish?
   - What obstacles prevent success? (Reference specific feedback IDs)
   - How severe is this pain point based on urgency and sentiment?

2. **Impact Assessment**
   - Estimate users affected (use evidence from ${cluster.size} feedback entries)
   - Assess business impact on revenue, churn, satisfaction
   - Provide quantified estimates where possible

3. **Strategic Recommendations**
   - Generate 2-4 specific, actionable recommendations
   - Prioritize by impact and effort
   - Include realistic timelines and success metrics
   - Consider user segments: ${cluster.userSegments.join(', ')}

Use the generate_insight tool to provide structured results with evidence references and confidence levels.`
  }

  /**
   * Parse AI response into structured insight
   */
  private parseInsightResponse(response: string, cluster: FeedbackCluster): any {
    const result = extractJson<any>(response)
    
    if (result.success && result.data) {
      // Validate required fields
      if (result.data.title && result.data.painPoint && result.data.impact && result.data.recommendations) {
        return result.data
      }
    }
    
    // Extraction failed, throw error to trigger fallback
    console.error('Failed to parse insight response:', result.error)
    throw new Error(`Failed to parse insight response: ${result.error || 'Unknown error'}`)
  }

  /**
   * Create fallback insight when AI generation fails
   */
  private createFallbackInsight(cluster: FeedbackCluster, evidenceChain: EvidenceChain): any {
    return {
      title: `${cluster.theme} - Requires Investigation`,
      executiveSummary: `Analysis of ${cluster.size} feedback entries reveals ${cluster.dominantSentiment} sentiment regarding ${cluster.theme.toLowerCase()}. Product team attention required.`,
      detailedAnalysis: `Cluster analysis shows consistent ${cluster.dominantSentiment} sentiment across ${cluster.size} feedback entries. The issue affects ${cluster.userSegments.join(' and ')} user segments and relates to ${cluster.productAreas.join(', ')} product areas. ${cluster.urgencyDistribution.high} entries marked as high urgency, indicating need for prompt investigation.`,
      painPoint: {
        description: `Users experiencing challenges with ${cluster.theme.toLowerCase()}`,
        severity: cluster.urgencyDistribution.high > 0 ? 'high' : (cluster.urgencyDistribution.medium > 0 ? 'medium' : 'low'),
        userJourneyStage: 'usage',
        frequencyOfMention: cluster.size
      },
      impact: {
        usersAffected: cluster.size,
        userSegments: cluster.userSegments,
        businessImpact: {
          revenue: 'neutral',
          churn: cluster.dominantSentiment === 'negative' ? 'increase' : 'neutral',
          satisfaction: cluster.dominantSentiment === 'negative' ? 'decline' : 'maintain'
        },
        quantifiedEstimates: []
      },
      recommendations: [{
        title: `Investigate ${cluster.theme} Issues`,
        description: `Conduct detailed analysis of ${cluster.theme.toLowerCase()} to identify root causes and potential solutions`,
        category: 'process-improvement' as const,
        priority: cluster.urgencyDistribution.high > 0 ? 'high' as const : 'medium' as const,
        effort: 'medium' as const,
        timeline: '2-3 weeks',
        successMetrics: [
          'Root cause identified',
          'Solution approach defined',
          'User satisfaction improvement plan created'
        ]
      }]
    }
  }

  /**
   * Generate stakeholder-specific formats
   */
  private generateStakeholderFormats(
    coreInsight: any,
    cluster: FeedbackCluster
  ): GeneratedInsight['stakeholderFormats'] {
    
    const topRecommendation = coreInsight.recommendations.find((r: any) => r.priority === 'critical' || r.priority === 'high') || coreInsight.recommendations[0]
    
    return {
      executive: `${coreInsight.impact.usersAffected} users affected by ${coreInsight.painPoint.description.toLowerCase()}. ${coreInsight.impact.businessImpact.revenue !== 'neutral' ? 'Revenue impact expected.' : ''} ${topRecommendation ? `Recommend: ${topRecommendation.title}` : 'Investigation needed.'}`,
      
      product: `**Pain Point**: ${coreInsight.painPoint.description}\n**Impact**: ${coreInsight.impact.usersAffected} users (${coreInsight.impact.userSegments.join(', ')})\n**Priority**: ${coreInsight.painPoint.severity}\n**Next Steps**: ${topRecommendation?.title || 'Investigate and plan solution'}`,
      
      engineering: `**Technical Issue**: ${coreInsight.painPoint.description}\n**Scope**: ${coreInsight.impact.usersAffected} users affected\n**Priority**: ${coreInsight.painPoint.severity} severity\n**Effort**: ${topRecommendation ? `${topRecommendation.effort} effort, ${topRecommendation.timeline}` : 'TBD'}`,
      
      customerSuccess: `**Customer Impact**: ${coreInsight.painPoint.description}\n**Affected Segments**: ${coreInsight.impact.userSegments.join(', ')}\n**Satisfaction Impact**: ${coreInsight.impact.businessImpact.satisfaction}\n**Communication**: ${coreInsight.painPoint.severity === 'critical' ? 'Proactive outreach recommended' : 'Monitor for escalations'}`
    }
  }

  /**
   * Calculate confidence score for insight
   */
  private calculateConfidence(coreInsight: any, evidenceChain: EvidenceChain): number {
    let confidence = 0.7 // Base confidence
    
    // Boost for cluster size
    if (evidenceChain.sourceCluster.size >= 5) confidence += 0.1
    if (evidenceChain.sourceCluster.size >= 10) confidence += 0.1
    
    // Boost for cluster confidence
    confidence += evidenceChain.sourceCluster.confidence * 0.2
    
    // Boost for specific recommendations
    if (coreInsight.recommendations.length >= 2) confidence += 0.05
    
    // Boost for quantified impact
    if (coreInsight.impact.quantifiedEstimates?.length > 0) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }
}
