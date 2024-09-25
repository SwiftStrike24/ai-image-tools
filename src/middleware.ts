import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

export default async function middleware(req: NextRequest) {
  console.log('Middleware called for path:', req.nextUrl.pathname);

  // Run Clerk middleware
  const clerkResponse = clerkMiddleware()(req, { sourcePage: req.url } as NextFetchEvent);

  // If Clerk middleware redirects or modifies the response, return it
  if ((clerkResponse as NextResponse).status !== 200) {
    return clerkResponse as NextResponse;
  }

  const { userId } = auth();

  // Redirection logic for admin-protected routes
  if (
    req.nextUrl.pathname.startsWith('/upscaler') ||
    req.nextUrl.pathname.startsWith('/generator') ||
    req.nextUrl.pathname.startsWith('/admin/waitlist')
  ) {
    const adminAuthenticated = req.cookies.get('admin_authenticated')?.value;

    // If not admin authenticated or user is not authenticated, redirect to admin login
    if (adminAuthenticated !== 'true' || !userId) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If no redirects or modifications are needed, proceed with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
