import { Tool } from '@/lib/chat/ChatWrapper'

/**
 * Tool definition for insight generation
 * 
 * This tool constrains the AI model to return structured insight data
 * that transforms feedback clusters into actionable business insights.
 */
export const insightGenerationTool: Tool = {
  type: 'function',
  function: {
    name: 'generate_insight',
    description: 'Generate actionable business insight from customer feedback cluster with evidence-based analysis and prioritized recommendations.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Clear, specific insight title that captures the core issue or opportunity'
        },
        executiveSummary: {
          type: 'string',
          description: '2-3 sentence executive summary focusing on business impact and key findings'
        },
        detailedAnalysis: {
          type: 'string',
          description: 'Comprehensive analysis with evidence references and root cause analysis'
        },
        painPoint: {
          type: 'object',
          description: 'Core user pain point identified from the cluster',
          properties: {
            description: {
              type: 'string',
              description: 'Clear description of the specific user pain point'
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Severity level based on urgency and user impact'
            },
            userJourneyStage: {
              type: 'string',
              description: 'Where in the user journey this pain point occurs (e.g., onboarding, usage, billing)'
            },
            frequencyOfMention: {
              type: 'number',
              description: 'Number of feedback entries that mention this pain point'
            }
          },
          required: ['description', 'severity', 'userJourneyStage', 'frequencyOfMention']
        },
        impact: {
          type: 'object',
          description: 'Business impact assessment',
          properties: {
            usersAffected: {
              type: 'number',
              description: 'Estimated number of users affected by this issue'
            },
            userSegments: {
              type: 'array',
              description: 'User segments most affected by this issue',
              items: {
                type: 'string'
              }
            },
            businessImpact: {
              type: 'object',
              description: 'Expected business impact across key metrics',
              properties: {
                revenue: {
                  type: 'string',
                  enum: ['positive', 'negative', 'neutral'],
                  description: 'Expected impact on revenue'
                },
                churn: {
                  type: 'string',
                  enum: ['increase', 'decrease', 'neutral'],
                  description: 'Expected impact on customer churn'
                },
                satisfaction: {
                  type: 'string',
                  enum: ['improve', 'decline', 'maintain'],
                  description: 'Expected impact on customer satisfaction'
                }
              },
              required: ['revenue', 'churn', 'satisfaction']
            },
            quantifiedEstimates: {
              type: 'array',
              description: 'Specific quantified impact estimates where possible',
              items: {
                type: 'object',
                properties: {
                  metric: {
                    type: 'string',
                    description: 'Name of the metric (e.g., "Monthly Churn Rate", "Support Tickets")'
                  },
                  estimatedChange: {
                    type: 'string',
                    description: 'Quantified estimate (e.g., "+2% monthly churn", "15% fewer tickets")'
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confidence in this estimate (0.0-1.0)',
                    minimum: 0,
                    maximum: 1
                  }
                },
                required: ['metric', 'estimatedChange', 'confidence']
              }
            }
          },
          required: ['usersAffected', 'userSegments', 'businessImpact']
        },
        recommendations: {
          type: 'array',
          description: 'Prioritized, actionable recommendations to address the pain point',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Specific action title (verb + noun format)'
              },
              description: {
                type: 'string',
                description: 'Detailed description of what to do and expected outcome'
              },
              category: {
                type: 'string',
                enum: ['bug-fix', 'enhancement', 'new-feature', 'process-improvement'],
                description: 'Type of recommendation'
              },
              priority: {
                type: 'string',
                enum: ['critical', 'high', 'medium', 'low'],
                description: 'Priority level based on impact and urgency'
              },
              effort: {
                type: 'string',
                enum: ['small', 'medium', 'large', 'extra-large'],
                description: 'Estimated implementation effort'
              },
              timeline: {
                type: 'string',
                description: 'Estimated timeline for implementation (e.g., "1-2 weeks", "1 month")'
              },
              successMetrics: {
                type: 'array',
                description: 'Measurable success criteria',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['title', 'description', 'category', 'priority', 'effort', 'timeline', 'successMetrics']
          }
        }
      },
      required: ['title', 'executiveSummary', 'detailedAnalysis', 'painPoint', 'impact', 'recommendations']
    }
  }
}
