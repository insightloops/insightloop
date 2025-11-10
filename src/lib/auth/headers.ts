import { NextRequest } from 'next/server'

/**
 * Extract user ID from request headers
 * This should be set by the frontend and passed through middleware
 */
export function getUserIdFromHeaders(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

/**
 * Extract user ID from request headers with validation
 * Throws error if user ID is missing
 */
export function requireUserIdFromHeaders(request: NextRequest): string {
  const userId = getUserIdFromHeaders(request)
  
  if (!userId) {
    throw new Error('User ID is required but missing from headers')
  }
  
  return userId
}

/**
 * Create response for missing user ID
 */
export function createMissingUserIdResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'User ID is required',
      message: 'x-user-id header must be provided'
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
