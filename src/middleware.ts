import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { saveUserToSupabase, syncUserDataWithRedis, getUserSubscription } from "@/lib/supabase";

export default async function middleware(req: NextRequest) {
  // Exclude the webhook routes from middleware processing
  if (req.nextUrl.pathname === '/api/webhooks/stripe' || req.nextUrl.pathname === '/api/webhooks/clerk') {
    return NextResponse.next();
  }

  // Run Clerk middleware
  const clerkResponse = clerkMiddleware()(req, { sourcePage: req.url } as NextFetchEvent);

  // If Clerk middleware redirects or modifies the response, return it
  if ((clerkResponse as NextResponse).status !== 200) {
    return clerkResponse as NextResponse;
  }

  const { userId } = auth();

  // Save user data to Supabase and sync with Redis if authenticated
  if (userId) {
    try {
      // Check if the user exists in Supabase
      const existingSubscription = await getUserSubscription(userId);
      
      if (!existingSubscription) {
        // If the user doesn't exist in Supabase, save them
        await saveUserToSupabase(userId);
        console.log(`New user ${userId} saved to Supabase`);
      } else {
        // If the user exists, update their data
        await saveUserToSupabase(userId);
        console.log(`Existing user ${userId} updated in Supabase`);
      }

      // Sync user data with Redis
      await syncUserDataWithRedis(userId);
      console.log(`User ${userId} synced with Redis`);

      // Add the redirect URL to the response headers
      const redirectUrl = req.nextUrl.searchParams.get('redirect');
      if (redirectUrl) {
        const response = NextResponse.next();
        response.headers.set('X-Auth-Redirect-Url', redirectUrl);
        return response;
      }
    } catch (error) {
      console.error(`Error processing user ${userId}:`, error);
      // Instead of throwing an error, we'll log it and continue
      // This prevents the middleware from blocking the request
    }
  }

  // If no redirects or modifications are needed, proceed with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/webhooks/stripe|api/webhooks/clerk|_next/static|_next/image|favicon.ico).*)',
  ],
};
