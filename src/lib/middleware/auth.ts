import { NextRequest, NextResponse } from 'next/server'

export interface AuthenticatedRequest extends NextRequest {
  userId: string
}

/**
 * Authentication middleware to extract and validate userId from request headers
 * Expects 'x-user-id' header to be present in the request
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract userId from request headers
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          message: 'x-user-id header is required'
        },
        { status: 401 }
      )
    }

    // Validate userId format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid user ID format',
          code: 'INVALID_USER_ID',
          message: 'x-user-id must be a valid UUID'
        },
        { status: 400 }
      )
    }

    // Attach user context to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.userId = userId

    return await handler(authenticatedRequest)
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      {
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        message: 'Failed to validate user ID'
      },
      { status: 401 }
    )
  }
}

/**
 * Extract user ID from request headers
 * Alternative method for components that need direct user ID access
 */
export function extractUserId(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id')
  
  if (!userId) {
    return null
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    return null
  }
  
  return userId
}

/**
 * Validation helper to ensure user context exists
 */
export function requireAuth(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    throw new Error('User authentication required')
  }
}

/**
 * Check if user has access to a specific company
 * This will be implemented by services that have access to the database
 */
export async function validateCompanyAccess(
  userId: string,
  companyId: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    const { data: company, error } = await supabaseClient
      .from('companies')
      .select('user_id')
      .eq('id', companyId)
      .single()
    
    if (error || !company) {
      return false
    }
    
    return company.user_id === userId
  } catch (error) {
    console.error('Company access validation failed:', error)
    return false
  }
}

/**
 * Middleware wrapper for API routes that need authentication
 */
export function createAuthenticatedHandler(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    return withAuth(request, handler)
  }
}
