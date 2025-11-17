import { Tool } from '@/lib/chat/ChatWrapper'

/**
 * Tool definition for semantic clustering
 * 
 * This tool constrains the AI model to return structured clustering data
 * that groups feedback entries into meaningful semantic clusters.
 */
export const feedbackClusteringTool: Tool = {
  type: 'function',
  function: {
    name: 'cluster_feedback',
    description: 'Group enriched feedback entries into semantic clusters based on themes, topics, and user intent.',
    parameters: {
      type: 'object',
      properties: {
        clusters: {
          type: 'array',
          description: 'Array of semantic clusters grouping related feedback',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique cluster identifier (e.g., cluster_1, cluster_2)'
              },
              theme: {
                type: 'string',
                description: 'Clear, specific theme name that captures the essence of the grouped feedback'
              },
              description: {
                type: 'string',
                description: 'Detailed explanation of what this cluster represents and why these feedback items belong together'
              },
              entryIds: {
                type: 'array',
                description: 'Array of feedback entry IDs that belong to this cluster',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['id', 'theme', 'description', 'entryIds']
          }
        }
      },
      required: ['clusters']
    }
  }
}
