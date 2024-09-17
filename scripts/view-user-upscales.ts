import { config } from 'dotenv';
import { kv } from "@vercel/kv";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { UPSCALER_DAILY_LIMIT, UPSCALER_KEY_PREFIX } from "../src/constants/rateLimits";

// Load environment variables from .env.local
config({ path: '.env.local' });

function getTimeRemaining(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const timeRemaining = midnight.getTime() - now.getTime();
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function viewUserUpscales() {
  try {
    const keys = await kv.keys(`${UPSCALER_KEY_PREFIX}*`);
    const userKeys = keys.filter(key => !key.endsWith(':date'));

    const userUpscales = await Promise.all(userKeys.map(async (key) => {
      const userId = key.replace(UPSCALER_KEY_PREFIX, '');
      const usageCount = await kv.get(key) as number;
      const remainingUpscales = UPSCALER_DAILY_LIMIT - (usageCount || 0);
      const totalUpscaled = usageCount || 0;

      let username = 'Unknown';
      let email = 'Unknown';
      try {
        const user = await clerkClient.users.getUser(userId);
        username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
        email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
      }

      return { userId, username, email, remainingUpscales, totalUpscaled };
    }));

    const timeRemaining = getTimeRemaining();

    console.log("User Upscales Summary:");
    console.log("------------------------------------------------------------------------------------------------------------------------");
    console.log("User ID                          | Username       | Email                  | Remaining | Total Upscaled | Time Remaining");
    console.log("------------------------------------------------------------------------------------------------------------------------");
    userUpscales.forEach(({ userId, username, email, remainingUpscales, totalUpscaled }) => {
      console.log(
        `${userId.padEnd(22)} | ${username.padEnd(14)} | ${email.padEnd(22)} | ${
          String(remainingUpscales).padStart(9)
        } | ${String(totalUpscaled).padStart(14)} | ${timeRemaining}`
      );
    });
    console.log("------------------------------------------------------------------------------------------------------------------------");

    const totalUsers = userUpscales.length;
    const totalUpscaled = userUpscales.reduce((sum, user) => sum + user.totalUpscaled, 0);
    const totalRemaining = userUpscales.reduce((sum, user) => sum + user.remainingUpscales, 0);
    const totalCost = (totalUpscaled * 0.0017).toFixed(4).toString(); // Calculate total cost

    console.log(`\nSummary:`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total upscales used: ${totalUpscaled}`);
    console.log(`Total remaining upscales: ${totalRemaining}`);
    console.log(`Total cost of upscales: $${totalCost}`);
    console.log(`Time until reset: ${timeRemaining}`);

    // Find users close to their limit
    const usersNearLimit = userUpscales.filter(user => user.remainingUpscales <= 5);
    if (usersNearLimit.length > 0) {
      console.log("\nUsers with 5 or fewer upscales remaining:");
      usersNearLimit.forEach(user => {
        console.log(`- ${user.username} (${user.email}): ${user.remainingUpscales} remaining`);
      });
    }

  } catch (error) {
    console.error("Error fetching user upscales:", error);
  }
}

viewUserUpscales();