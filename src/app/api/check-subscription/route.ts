import { NextResponse } from 'next/server';
import { auth, currentUser } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

export async function GET() {
	let userId;
	try {
		const authResult = auth();
		userId = authResult.userId;
	} catch (error) {
		console.error("Error getting userId from auth():", error);
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
		
		const redisClient = await getRedisClient();
		subscription = await redisClient.get(subscriptionKey);

		const isPro = subscription === "pro";
		const isPremium = subscription === "premium";
		const isUltimate = subscription === "ultimate";

		return NextResponse.json({ isPro, isPremium, isUltimate, subscriptionType: subscription || "basic" });
	} catch (error) {
		console.error("Error checking subscription:", error);
		return NextResponse.json({ error: "Internal server error", subscriptionType: "basic" }, { status: 500 });
	}
}