import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const adminSession = request.cookies.get('admin_session')

  if (pathname.startsWith('/admin') && !adminSession) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
