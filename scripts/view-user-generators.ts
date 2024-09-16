import { config } from 'dotenv';
import { kv } from "@vercel/kv";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Load environment variables from .env.local
config({ path: '.env.local' });

const DAILY_LIMIT = 20;
const GENERATOR_KEY_PREFIX = 'generator_daily_usage:';

async function viewUserGenerators() {
  try {
    // Get all keys that start with the generator daily usage prefix
    const keys = await kv.keys(`${GENERATOR_KEY_PREFIX}*`);
    
    // Filter out date keys
    const userKeys = keys.filter(key => !key.endsWith(':date'));

    const userGenerators = await Promise.all(userKeys.map(async (key) => {
      const userId = key.replace(GENERATOR_KEY_PREFIX, '');
      const usageCount = await kv.get(key) as number;
      const remainingGenerations = DAILY_LIMIT - (usageCount || 0);

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

      return { userId, username, email, usageCount, remainingGenerations };
    }));

    console.log("User Generator Usage:");
    console.log("---------------------------------------------------------------------------------------------------------------");
    console.log("User ID                          | Username       | Email                  | Used | Remaining | Total Generated");
    console.log("---------------------------------------------------------------------------------------------------------------");

    userGenerators.forEach(({ userId, username, email, usageCount, remainingGenerations }) => {
      console.log(`${userId.padEnd(22)} | ${username.padEnd(14)} | ${email.padEnd(22)} | ${String(usageCount).padEnd(4)} | ${String(remainingGenerations).padEnd(9)} | ${usageCount}`);
    });
    console.log("---------------------------------------------------------------------------------------------------------------");

    const totalUsers = userGenerators.length;
    const totalUsed = userGenerators.reduce((sum, user) => sum + (user.usageCount || 0), 0);
    const totalRemaining = userGenerators.reduce((sum, user) => sum + user.remainingGenerations, 0);

    console.log(`\nTotal users: ${totalUsers}`);
    console.log(`Total images generated: ${totalUsed}`);
    console.log(`Total remaining generations: ${totalRemaining}`);

    // Find users close to their limit
    const usersNearLimit = userGenerators.filter(user => user.remainingGenerations <= 5);
    if (usersNearLimit.length > 0) {
      console.log("\nUsers with 5 or fewer generations remaining:");
      usersNearLimit.forEach(user => {
        console.log(`- ${user.username} (${user.email}): ${user.remainingGenerations} remaining`);
      });
    }

  } catch (error) {
    console.error("Error fetching user generator usage:", error);
  }
}

viewUserGenerators();