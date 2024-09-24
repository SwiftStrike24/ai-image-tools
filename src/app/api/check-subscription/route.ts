import { NextResponse } from 'next/server';
import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

export async function GET() {
	let userId;
	try {
		// Try to get userId from auth()
		const authResult = auth();
		userId = authResult.userId;
	} catch (error) {
		console.error("Error getting userId from auth():", error);
		// Fallback to currentUser() if auth() fails
		try {
			const user = await currentUser();
			userId = user?.id;
		} catch (fallbackError) {
			console.error("Error getting userId from currentUser():", fallbackError);
			return NextResponse.json({ error: "Failed to authenticate user" }, { status: 401 });
		}
	}

	if (!userId) {
		return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
	}

	try {
		const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
		let subscription;
		
		try {
			subscription = await kv.get(subscriptionKey);
		} catch (kvError) {
			console.error("Error accessing Vercel KV:", kvError);
			// Fallback to a default subscription or another data source
			subscription = "basic"; // You might want to adjust this based on your needs
		}

		const isPro = subscription === "pro";
		const isPremium = subscription === "premium";
		const isUltimate = subscription === "ultimate";

		return NextResponse.json({ isPro, isPremium, isUltimate, subscriptionType: subscription });
	} catch (error) {
		console.error("Error checking subscription:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}