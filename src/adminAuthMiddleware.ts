import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function adminAuthMiddleware(req: NextRequest) {
  const adminAuthenticated = req.cookies.get('admin_authenticated')?.value;

  // If not admin authenticated, redirect to admin login
  if (adminAuthenticated !== 'true') {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If admin authenticated, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/upscaler/:path*', '/generator/:path*'],
};