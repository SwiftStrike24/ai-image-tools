import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function adminAuthMiddleware(req: NextRequest) {
  const adminAuthenticated = req.cookies.get('admin_authenticated')?.value;

  // Only check admin authentication for the admin waitlist API route
  if (req.nextUrl.pathname.startsWith('/api/admin/waitlist')) {
    if (adminAuthenticated !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/waitlist/:path*'],
};