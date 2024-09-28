import { clerkMiddleware, auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { saveUserToSupabase, testSupabaseConnection } from "@/lib/supabase";

export default async function middleware(req: NextRequest) {
  console.log('Middleware called for path:', req.nextUrl.pathname);

  // Run Clerk middleware
  const clerkResponse = clerkMiddleware()(req, { sourcePage: req.url } as NextFetchEvent);

  // If Clerk middleware redirects or modifies the response, return it
  if ((clerkResponse as NextResponse).status !== 200) {
    return clerkResponse as NextResponse;
  }

  const { userId } = auth();
  console.log('User ID from auth:', userId);

  // Save user data to Supabase if authenticated
  if (userId) {
    try {
      console.log('Testing Supabase connection...');
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.error('Failed to connect to Supabase, skipping user save');
        return NextResponse.next();
      }
      console.log('Supabase connection successful');

      console.log('Fetching user data from Clerk');
      const user = await clerkClient.users.getUser(userId);
      if (user) {
        console.log('User data fetched, saving to Supabase');
        const result = await saveUserToSupabase(user);
        console.log('Save user result:', result);
      } else {
        console.log('No user data returned from Clerk');
      }
    } catch (error) {
      console.error('Error in middleware while saving user to Supabase:', error);
    }
  } else {
    console.log('No user ID, skipping Supabase save');
  }

  // Allow access to sign-in page without redirection
  if (req.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.next();
  }

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
