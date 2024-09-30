import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { saveUserToSupabase, syncUserDataWithRedis } from "@/lib/supabase";

// Add a simple in-memory cache
const userSaveCache: { [key: string]: number } = {};

export default async function middleware(req: NextRequest) {
  console.log('Middleware called for path:', req.nextUrl.pathname);

  // Run Clerk middleware
  const clerkResponse = clerkMiddleware()(req, { sourcePage: req.url } as NextFetchEvent);

  // If Clerk middleware redirects or modifies the response, return it
  if ((clerkResponse as NextResponse).status !== 200) {
    return clerkResponse as NextResponse;
  }

  const { userId } = auth();

  // Save user data to Supabase and sync with Redis if authenticated and not recently saved
  if (userId) {
    const currentTime = Date.now();
    if (!userSaveCache[userId] || currentTime - userSaveCache[userId] > 300000) { // 5 minutes
      try {
        console.log('Attempting to save user to Supabase and sync with Redis:', userId);
        await saveUserToSupabase(userId);
        await syncUserDataWithRedis(userId);
        userSaveCache[userId] = currentTime;
        console.log('User saved successfully to Supabase and synced with Redis:', userId);
      } catch (error) {
        console.error('Error in middleware while saving user to Supabase and syncing with Redis:', error);
      }
    }
  }

  // Allow access to sign-in page without redirection
  if (req.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.next();
  }

  // Remove the admin authentication check for /upscaler and /generator routes

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
