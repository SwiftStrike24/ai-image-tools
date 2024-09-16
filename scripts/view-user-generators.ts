import { config } from 'dotenv';
import { kv } from "@vercel/kv";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { GENERATOR_DAILY_LIMIT, GENERATOR_KEY_PREFIX } from "../src/constants/rateLimits";

// Load environment variables from .env.local
config({ path: '.env.local' });

// No need to initialize Clerk, we'll use clerkClient directly

function getTimeRemaining(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const timeRemaining = midnight.getTime() - now.getTime();
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function viewUserGenerators() {
  try {
    const keys = await kv.keys(`${GENERATOR_KEY_PREFIX}*`);
    const userKeys = keys.filter(key => !key.endsWith(':date'));

    const userGenerators = await Promise.all(userKeys.map(async (key) => {
      const userId = key.replace(GENERATOR_KEY_PREFIX, '');
      const usageCount = await kv.get(key) as number;
      const remainingGenerations = GENERATOR_DAILY_LIMIT - (usageCount || 0);
      const totalGenerated = usageCount || 0;

      let username = 'Unknown';
      let email = 'Unknown';
      try {
        const user = await clerkClient.users.getUser(userId);
        username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
        email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
      }

      return { userId, username, email, remainingGenerations, totalGenerated };
    }));

    const timeRemaining = getTimeRemaining();

    console.log("User Generator Usage Summary:");
    console.log("---------------------------------------------------------------------------------------------------------------------------");
    console.log("User ID                          | Username       | Email                  | Remaining | Total Generated | Time Until Reset");
    console.log("---------------------------------------------------------------------------------------------------------------------------");

    userGenerators.forEach(({ userId, username, email, remainingGenerations, totalGenerated }) => {
      console.log(
        `${userId.padEnd(22)} | ${username.padEnd(14)} | ${email.padEnd(22)} | ${
          String(remainingGenerations).padStart(9)
        } | ${String(totalGenerated).padStart(16)} | ${timeRemaining}`
      );
    });
    console.log("---------------------------------------------------------------------------------------------------------------------------");

    const totalUsers = userGenerators.length;
    const totalGenerated = userGenerators.reduce((sum, user) => sum + user.totalGenerated, 0);
    const totalRemaining = userGenerators.reduce((sum, user) => sum + user.remainingGenerations, 0);

    console.log(`\nSummary:`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total images generated: ${totalGenerated}`);
    console.log(`Total remaining generations: ${totalRemaining}`);
    console.log(`Time until reset: ${timeRemaining}`);

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