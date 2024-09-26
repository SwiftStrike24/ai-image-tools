import { config } from 'dotenv';
import { getRedisClient } from "../src/lib/redis";
import { RedisClientType } from 'redis';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function viewWaitlist() {
  const waitlistKey = "waitlist";
  let redisClient: RedisClientType | null = null;
  try {
    redisClient = await getRedisClient();
    const emails = await redisClient.sMembers(waitlistKey);
    
    if (emails.length === 0) {
      console.log("The waitlist is currently empty.");
    } else {
      console.log("Waitlist emails:");
      emails.forEach((email, index) => {
        console.log(`${index + 1}. ${email}`);
      });
      console.log(`Total emails in waitlist: ${emails.length}`);
    }
  } catch (error) {
    console.error("Error fetching waitlist:", error);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}

viewWaitlist();