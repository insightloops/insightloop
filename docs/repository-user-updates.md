# Repository Update Examples for User Linking

This document shows how to update repository methods to include user context for the new user linking functionality.

## Updated CompanyRepository Example

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { Company, CompanyInsert, CompanyUpdate } from '@/types/database'

export class CompanyRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // Updated create method with user context
  async create(data: {
    name: string
    slug: string
    industry?: string
    size?: string
    userId: string // New: user who owns the company
    createdByUserId?: string // New: user who created the record
  }): Promise<Company> {
    const insertData: CompanyInsert = {
      name: data.name,
      slug: data.slug,
      industry: data.industry,
      size: data.size,
      user_id: data.userId,
      created_by_user_id: data.createdByUserId || data.userId
    }

    const { data: result, error } = await this.supabase
      .from('companies')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create company: ${error.message}`)
    }

    return result as Company
  }

  // Updated findAll to filter by user context
  async findAllForUser(userId: string): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .or(`user_id.eq.${userId},created_by_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find companies for user: ${error.message}`)
    }

    return data as Company[]
  }

  // Find companies owned by user
  async findOwnedByUser(userId: string): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find owned companies: ${error.message}`)
    }

    return data as Company[]
  }

  // Update method with user validation
  async update(id: string, data: CompanyUpdate, userId: string): Promise<Company> {
    // First verify user has permission to update
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error('Company not found')
    }

    if (existing.user_id !== userId && existing.created_by_user_id !== userId) {
      throw new Error('Insufficient permissions to update company')
    }

    const { data: result, error } = await this.supabase
      .from('companies')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update company: ${error.message}`)
    }

    return result as Company
  }
}
```

## Updated FeatureRepository Example

```typescript
export class FeatureRepository {
  // Create feature with assignment support
  async create(data: {
    name: string
    description?: string
    productAreaId: string
    companyId: string
    status?: FeatureStatus
    priority?: FeaturePriority
    effortScore?: number
    businessValue?: number
    userId: string // Feature owner
    createdByUserId?: string // Creator
    assignedToUserId?: string // Developer assigned
  }): Promise<Feature> {
    const insertData: FeatureInsert = {
      name: data.name,
      description: data.description,
      product_area_id: data.productAreaId,
      company_id: data.companyId,
      status: data.status || FeatureStatus.PLANNED,
      priority: data.priority || FeaturePriority.MEDIUM,
      effort_score: data.effortScore,
      business_value: data.businessValue,
      user_id: data.userId,
      created_by_user_id: data.createdByUserId || data.userId,
      assigned_to_user_id: data.assignedToUserId
    }

    const { data: result, error } = await this.supabase
      .from('features')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create feature: ${error.message}`)
    }

    return result as Feature
  }

  // Find features assigned to a user
  async findAssignedToUser(userId: string): Promise<Feature[]> {
    const { data, error } = await this.supabase
      .from('features')
      .select(`
        *,
        product_areas (
          id,
          name,
          products (
            id,
            name,
            companies (
              id,
              name
            )
          )
        )
      `)
      .eq('assigned_to_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find assigned features: ${error.message}`)
    }

    return data as Feature[]
  }

  // Find features created by user
  async findCreatedByUser(userId: string): Promise<Feature[]> {
    const { data, error } = await this.supabase
      .from('features')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find created features: ${error.message}`)
    }

    return data as Feature[]
  }

  // Assign feature to user
  async assignToUser(featureId: string, assignedUserId: string, currentUserId: string): Promise<Feature> {
    // Verify permissions
    const feature = await this.findById(featureId)
    if (!feature) {
      throw new Error('Feature not found')
    }

    if (feature.user_id !== currentUserId && feature.created_by_user_id !== currentUserId) {
      throw new Error('Insufficient permissions to assign feature')
    }

    const { data: result, error } = await this.supabase
      .from('features')
      .update({ assigned_to_user_id: assignedUserId })
      .eq('id', featureId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to assign feature: ${error.message}`)
    }

    return result as Feature
  }
}
```

## Service Layer Updates

Services should also be updated to pass user context:

```typescript
export class FeatureService {
  private featureRepository: FeatureRepository

  async createFeature(
    featureData: CreateFeatureRequest,
    userId: string
  ): Promise<Feature> {
    // Validate user has access to the product area
    const productArea = await this.productAreaRepository.findById(
      featureData.productAreaId
    )
    
    if (!productArea) {
      throw new Error('Product area not found')
    }

    // Check user permissions for the company
    const hasAccess = await this.validateUserAccess(
      productArea.company_id,
      userId
    )
    
    if (!hasAccess) {
      throw new Error('Insufficient permissions')
    }

    return this.featureRepository.create({
      ...featureData,
      userId,
      createdByUserId: userId
    })
  }

  async assignFeature(
    featureId: string,
    assignedUserId: string,
    currentUserId: string
  ): Promise<Feature> {
    return this.featureRepository.assignToUser(
      featureId,
      assignedUserId,
      currentUserId
    )
  }

  private async validateUserAccess(companyId: string, userId: string): Promise<boolean> {
    const company = await this.companyRepository.findById(companyId)
    return company?.user_id === userId || company?.created_by_user_id === userId
  }
}
```

## API Endpoint Updates

API endpoints should extract user context from authentication:

```typescript
// app/api/features/route.ts
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const featureData = await request.json()
    
    const featureService = new FeatureService(supabase)
    const feature = await featureService.createFeature(featureData, user.id)
    
    return NextResponse.json(feature)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

## Key Patterns

1. **Always pass user context** to repository methods
2. **Validate permissions** before allowing operations
3. **Use user-specific queries** to filter data
4. **Track both ownership and creation** for audit purposes
5. **Support assignment workflows** for features and objectives
6. **Filter by user context** at the API level for security

These patterns ensure proper multi-tenant security while enabling collaborative workflows.
