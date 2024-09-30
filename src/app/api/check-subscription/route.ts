import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import { getUserSubscription } from "@/lib/supabase";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const CACHE_DURATION = 300; // 5 minutes in seconds

export async function GET() {
	const { userId } = auth();

	if (!userId) {
		return NextResponse.json({ isAuthenticated: false, subscriptionType: "basic" });
	}

	try {
		const redisClient = await getRedisClient();
		const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
		
		// Check subscription in Redis
		let subscription = await redisClient.get(subscriptionKey);

		// If no subscription in Redis, check Supabase
		if (!subscription) {
			const supabaseSubscription = await getUserSubscription(userId);
			if (supabaseSubscription) {
				subscription = supabaseSubscription.plan;
				// Update Redis with Supabase data
				await redisClient.set(subscriptionKey, subscription, { EX: CACHE_DURATION });
			}
		}

		// If still no subscription, default to basic
		if (!subscription) {
			subscription = "basic";
			await redisClient.set(subscriptionKey, subscription, { EX: CACHE_DURATION });
		}

		const isPro = subscription === "pro";
		const isPremium = subscription === "premium";
		const isUltimate = subscription === "ultimate";

		return NextResponse.json({ 
			isAuthenticated: true, 
			isPro, 
			isPremium, 
			isUltimate, 
			subscriptionType: subscription 
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