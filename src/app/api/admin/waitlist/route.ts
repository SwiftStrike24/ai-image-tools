import { getRedisClient } from "@/lib/redis";
import { NextResponse } from "next/server";
import { RedisClientType } from 'redis';

export async function GET() {
  const waitlistKey = "waitlist";
  let redisClient: RedisClientType | null = null;
  try {
    redisClient = await getRedisClient();
    console.log("Attempting to fetch emails from Redis");
    const emails = await redisClient.sMembers(waitlistKey);
    console.log(`Fetched ${emails.length} emails from Redis`);
    
    if (!emails || emails.length === 0) {
      console.log("No emails found in Redis");
    }

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error fetching waitlist emails:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist emails" }, { status: 500 });
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}