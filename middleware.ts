import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Log all requests to lot pages
  if (pathname.includes('/lot/')) {
    console.log('🔴 MIDDLEWARE: Lot page request:', {
      pathname,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}