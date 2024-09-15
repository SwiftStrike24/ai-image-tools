import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

export default function middleware(req: NextRequest) {
  // Run Clerk middleware
  const clerkResponse = clerkMiddleware()(req, { sourcePage: req.url } as NextFetchEvent);

  // If Clerk middleware redirects or modifies the response, return it
  if ((clerkResponse as NextResponse).status !== 200) {
    return clerkResponse as NextResponse;
  }

  const { userId } = auth();

  // New redirection layer for /upscaler and /generator routes
  if (
    req.nextUrl.pathname.startsWith('/upscaler') ||
    req.nextUrl.pathname.startsWith('/generator')
  ) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // Existing custom middleware logic (unchanged)
  if (
    req.nextUrl.pathname.startsWith('/upscaler') ||
    req.nextUrl.pathname.startsWith('/generator')
  ) {
    const adminAuthenticated = req.cookies.get('admin_authenticated')?.value;

    // If not admin authenticated, redirect to admin login
    if (adminAuthenticated !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // If user is not authenticated, redirect to admin login
    if (!userId) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
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
