import { Tool } from '@/lib/chat/ChatWrapper'

/**
 * Tool definition for feedback enrichment
 * 
 * This tool constrains the AI model to return structured feedback enrichment data
 * that matches the EnrichedFeedbackData TypeScript type.
 */
export const feedbackEnrichmentTool: Tool = {
  type: 'function',
  function: {
    name: 'enrich_feedback',
    description: 'Enrich a single customer feedback entry with structured analysis including product area linking, sentiment analysis, feature extraction, urgency assessment, and category tagging.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The feedback entry ID'
        },
        linkedProductAreas: {
          type: 'array',
          description: 'Product areas linked to this feedback (1-3 most relevant)',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Product area ID from the provided list'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score (0.0-1.0)',
                minimum: 0,
                maximum: 1
              }
            },
            required: ['id', 'confidence']
          }
        },
        sentiment: {
          type: 'object',
          description: 'Sentiment analysis of the feedback',
          properties: {
            label: {
              type: 'string',
              enum: ['positive', 'negative', 'neutral'],
              description: 'Sentiment classification'
            },
            score: {
              type: 'number',
              description: 'Sentiment score (-1.0 to 1.0)',
              minimum: -1,
              maximum: 1
            },
            confidence: {
              type: 'number',
              description: 'Confidence in sentiment analysis (0.0-1.0)',
              minimum: 0,
              maximum: 1
            }
          },
          required: ['label', 'score', 'confidence']
        },
        extractedFeatures: {
          type: 'array',
          description: 'Specific features or topics mentioned in the feedback',
          items: {
            type: 'string'
          }
        },
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Urgency level based on language indicators'
        },
        category: {
          type: 'array',
          description: 'Classification tags for the feedback',
          items: {
            type: 'string'
          }
        }
      },
      required: ['id', 'linkedProductAreas', 'sentiment', 'extractedFeatures', 'urgency', 'category']
    }
  }
}
