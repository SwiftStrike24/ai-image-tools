import { config } from 'dotenv';
import { kv } from "@vercel/kv";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Load environment variables from .env.local
config({ path: '.env.local' });

const DAILY_LIMIT = 20;
const STORAGE_KEY_PREFIX = 'upscaler_daily_usage:';

async function viewUserUpscales() {
  try {
    // Get all keys that start with the upscaler daily usage prefix
    const keys = await kv.keys(`${STORAGE_KEY_PREFIX}*`);
    
    // Filter out date keys
    const userKeys = keys.filter(key => !key.endsWith(':date'));

    const userUpscales = await Promise.all(userKeys.map(async (key) => {
      const userId = key.replace(STORAGE_KEY_PREFIX, '');
      const usageCount = await kv.get(key) as number;
      const remainingUpscales = DAILY_LIMIT - (usageCount || 0);

      // Fetch user information from Clerk
      let username = 'Unknown';
      let email = 'Unknown';
      try {
        const user = await clerkClient.users.getUser(userId);
        username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
        email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
      }

      return { userId, username, email, remainingUpscales };
    }));

    console.log("User Upscales Remaining:");
    console.log("-------------------------------------------------------------------------------------------");
    console.log("User ID                          | Username       | Email                  | Remaining");
    console.log("-------------------------------------------------------------------------------------------");
    userUpscales.forEach(({ userId, username, email, remainingUpscales }) => {
      console.log(`${userId.padEnd(22)} | ${username.padEnd(14)} | ${email.padEnd(22)} | ${remainingUpscales}`);
    });
    console.log("-------------------------------------------------------------------------------------------");

    console.log(`\nTotal users: ${userUpscales.length}`);
  } catch (error) {
    console.error("Error fetching user upscales:", error);
  }
}

viewUserUpscales();