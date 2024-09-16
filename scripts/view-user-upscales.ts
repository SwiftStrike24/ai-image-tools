import { config } from 'dotenv';
import { kv } from "@vercel/kv";

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
      return { userId, remainingUpscales };
    }));

    console.log("User Upscales Remaining:");
    userUpscales.forEach(({ userId, remainingUpscales }) => {
      console.log(`User ${userId}: ${remainingUpscales} upscales remaining`);
    });

    console.log(`\nTotal users: ${userUpscales.length}`);
  } catch (error) {
    console.error("Error fetching user upscales:", error);
  }
}

viewUserUpscales();