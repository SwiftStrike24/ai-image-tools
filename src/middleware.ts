import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { saveUserToSupabase, syncUserDataWithRedis, getUserSubscription } from "@/lib/supabase";

// Define the routes to be excluded from middleware processing
const excludedRoutes = ['/api/webhooks/stripe', '/api/webhooks/clerk'];

/**
 * Middleware to handle user authentication and data synchronization.
 */
export default clerkMiddleware(async (auth, req) => {
  // Exclude the webhook routes from middleware processing
  if (excludedRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const { userId } = auth as any;

  // Save user data to Supabase and sync with Redis if authenticated
  if (userId) {
    try {
      const existingSubscription = await getUserSubscription(userId);
      
      if (!existingSubscription) {
        await saveUserToSupabase(userId);
        console.log(`New user ${userId} saved to Supabase`);
      } else {
        await saveUserToSupabase(userId);
        console.log(`Existing user ${userId} updated in Supabase`);
      }

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
    }
  }

  // Proceed with the request if no modifications are needed
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/webhooks/stripe|api/webhooks/clerk|_next/static|_next/image|favicon.ico).*)',
  ],
};
