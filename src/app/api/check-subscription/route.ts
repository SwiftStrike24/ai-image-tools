import { NextResponse } from 'next/server';
import { auth, currentUser } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import { saveUserToSupabase, getUserSubscription } from "@/lib/supabase";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

export async function GET() {
	let userId;
	let user;
	try {
		const authResult = auth();
		userId = authResult.userId;
		user = await currentUser();
	} catch (error) {
		console.error("Error getting userId from auth():", error);
		try {
			user = await currentUser();
			userId = user?.id;
		} catch (fallbackError) {
			console.error("Error getting userId from currentUser():", fallbackError);
			return NextResponse.json({ error: "Failed to authenticate user" }, { status: 401 });
		}
	}

	if (!userId || !user) {
		return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
	}

	try {
		// Save or update user in Supabase
		await saveUserToSupabase(user);

		// Check subscription in Redis
		const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
		let subscription;
		
		const redisClient = await getRedisClient();
		subscription = await redisClient.get(subscriptionKey);

		// If no subscription in Redis, check Supabase
		if (!subscription) {
			const supabaseSubscription = await getUserSubscription(userId);
			if (supabaseSubscription) {
				subscription = supabaseSubscription.plan;
				// Update Redis with Supabase data
				await redisClient.set(subscriptionKey, subscription);
			}
		}

		const isPro = subscription === "pro";
		const isPremium = subscription === "premium";
		const isUltimate = subscription === "ultimate";

		return NextResponse.json({ isPro, isPremium, isUltimate, subscriptionType: subscription || "basic" });
	} catch (error) {
		console.error("Error checking subscription:", error);
		return NextResponse.json({ error: "Internal server error", subscriptionType: "basic" }, { status: 500 });
	}
}