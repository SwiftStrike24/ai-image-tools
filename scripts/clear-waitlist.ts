import { config } from 'dotenv';
import { getRedisClient } from "../src/lib/redis";

// Load environment variables from .env.local
config({ path: '.env.local' });

async function clearWaitlist() {
  const waitlistKey = "waitlist";
  let redisClient;
  try {
    redisClient = await getRedisClient();
    await redisClient.del(waitlistKey);
    console.log("Waitlist cleared successfully.");
  } catch (error) {
    console.error("Error clearing waitlist:", error);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}

clearWaitlist();
