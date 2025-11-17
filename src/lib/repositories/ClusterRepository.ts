import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database-generated'

type FeedbackCluster = Database['public']['Tables']['feedback_clusters']['Row']
type ClusterMembership = Database['public']['Tables']['cluster_memberships']['Row']

export class ClusterRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  // Create a new cluster
  async create(clusterData: {
    company_id: string
    name: string
    description?: string
    theme?: string
    embedding?: number[]
    metadata?: Record<string, any>
  }): Promise<FeedbackCluster> {
    const { data, error } = await this.supabase
      .from('feedback_clusters')
      .insert(clusterData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create cluster: ${error.message}`)
    }

    return data
  }

  // Get cluster by ID
  async getById(id: string): Promise<FeedbackCluster | null> {
    const { data, error } = await this.supabase
      .from('feedback_clusters')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get cluster: ${error.message}`)
    }

    return data
  }

  // List clusters for a company
  async list(companyId: string): Promise<FeedbackCluster[]> {
    const { data, error } = await this.supabase
      .from('feedback_clusters')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to list clusters: ${error.message}`)
    }

    return data || []
  }

  // Update cluster
  async update(id: string, updates: Partial<FeedbackCluster>): Promise<FeedbackCluster> {
    const { data, error } = await this.supabase
      .from('feedback_clusters')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update cluster: ${error.message}`)
    }

    return data
  }

  // Delete cluster
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('feedback_clusters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting cluster:', error)
      return false
    }

    return true
  }

  // Get clusters with membership counts
  async getWithMembershipCounts(companyId: string): Promise<Array<FeedbackCluster & { member_count: number }>> {
    const { data, error } = await this.supabase
      .from('feedback_clusters')
      .select(`
        *,
        cluster_memberships (count)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get clusters with counts: ${error.message}`)
    }

    // Transform the data to include member count
    return (data || []).map(cluster => ({
      ...cluster,
      member_count: Array.isArray((cluster as any).cluster_memberships) 
        ? (cluster as any).cluster_memberships.length 
        : (cluster as any).cluster_memberships?.count || 0
    }))
  }

  // Add feedback items to cluster
  async addMembers(
    clusterId: string,
    feedbackIds: string[],
    similarityScores?: number[]
  ): Promise<boolean> {
    const memberships = feedbackIds.map((feedbackId, index) => ({
      cluster_id: clusterId,
      feedback_id: feedbackId,
      similarity_score: similarityScores?.[index]
    }))

    const { error } = await this.supabase
      .from('cluster_memberships')
      .insert(memberships)

    if (error) {
      console.error('Error adding cluster members:', error)
      return false
    }

    return true
  }

  // Remove feedback item from cluster
  async removeMember(clusterId: string, feedbackId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('cluster_memberships')
      .delete()
      .eq('cluster_id', clusterId)
      .eq('feedback_id', feedbackId)

    if (error) {
      console.error('Error removing cluster member:', error)
      return false
    }

    return true
  }

  // Get cluster members with similarity scores
  async getMembers(clusterId: string): Promise<Array<ClusterMembership & { 
    feedback_items: any 
  }>> {
    const { data, error } = await this.supabase
      .from('cluster_memberships')
      .select(`
        *,
        feedback_items (*)
      `)
      .eq('cluster_id', clusterId)
      .order('similarity_score', { ascending: false })

    if (error) {
      throw new Error(`Failed to get cluster members: ${error.message}`)
    }

    return data || []
  }

  // Find similar clusters by embedding
  async findSimilar(
    companyId: string,
    embedding: number[],
    threshold: number = 0.8,
    limit: number = 5
  ): Promise<FeedbackCluster[]> {
    // This would use pgvector similarity search in a real implementation
    // For now, return empty array as placeholder
    console.log('Similarity search not implemented yet - requires pgvector extension')
    return []
  }

  // Auto-cluster feedback items by theme
  async autoCluster(
    companyId: string,
    feedbackIds: string[],
    maxClusters: number = 10
  ): Promise<FeedbackCluster[]> {
    // Placeholder for auto-clustering logic
    // This would involve:
    // 1. Get embeddings for feedback items
    // 2. Use clustering algorithm (k-means, DBSCAN, etc.)
    // 3. Create clusters and memberships
    console.log('Auto-clustering not implemented yet - requires ML pipeline')
    return []
  }
}
