import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import { getUserSubscription, syncUserDataWithRedis } from "@/lib/supabase";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const CACHE_DURATION = 300; // 5 minutes in seconds

export async function GET() {
	const { userId } = auth();

	if (!userId) {
		return NextResponse.json({ isAuthenticated: false, subscriptionType: "basic" });
	}

	try {
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
				await redisClient.set(subscriptionKey, subscription, { EX: CACHE_DURATION });
				// Sync user data with Redis
				await syncUserDataWithRedis(userId);
			} else {
				subscription = "basic"; // Default to basic if no subscription found
			}
		}

		const isPro = subscription === "pro";
		const isPremium = subscription === "premium";
		const isUltimate = subscription === "ultimate";

		return NextResponse.json({ 
			isAuthenticated: true, 
			isPro, 
			isPremium, 
			isUltimate, 
			subscriptionType: subscription || "basic" 
		});
	} catch (error) {
		console.error("Error checking subscription:", error);
		return NextResponse.json({ 
			isAuthenticated: true, 
			error: "Internal server error", 
			subscriptionType: "basic" 
		}, { status: 500 });
	}
}