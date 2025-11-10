import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Extract user ID from header (frontend should pass this)
  const userId = request.headers.get('x-user-id')
  
  // For API routes, add the user ID to the request headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    
    if (userId) {
      requestHeaders.set('x-user-id', userId)
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
