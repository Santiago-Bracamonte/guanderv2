import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes
const protectedRoutes = ['/dashboard']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Dashboard auth check
  const token = request.cookies.get('token')?.value
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
