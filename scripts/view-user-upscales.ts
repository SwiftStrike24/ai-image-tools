import dotenv, { config } from 'dotenv';
dotenv.config({ path: '.env.local' });

import { clerkClient } from "@clerk/clerk-sdk-node";
import { UPSCALER_DAILY_LIMIT, UPSCALER_KEY_PREFIX } from "../src/constants/rateLimits";
import { getRedisClient } from "../src/lib/redis";

// Load environment variables from .env.local
config({ path: '.env.local' });

function getTimeRemaining(): string {
  const now = new Date();
  const utcNow = new Date(now.toUTCString()); // {{ edit_1 }}
  const midnight = new Date(utcNow);
  midnight.setUTCHours(24, 0, 0, 0); // {{ edit_2 }}
  const timeRemaining = midnight.getTime() - utcNow.getTime(); // {{ edit_3 }}
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function viewUserUpscales() {
  const redisClient = await getRedisClient();

  try {
    const keys = await redisClient.keys(`${UPSCALER_KEY_PREFIX}*`);
    const userKeys = keys.filter(key => !key.endsWith(':date') && !key.endsWith(':total')); // {{ edit_4 }}

    const userUpscales = await Promise.all(userKeys.map(async (key) => {
      const userId = key.replace(UPSCALER_KEY_PREFIX, '');
      const [usageCount, lastUsageDate, totalUpscaled] = await Promise.all([
        redisClient.get(key),
        redisClient.get(`${key}:date`),
        redisClient.get(`${key}:total`)
      ]);
      const usage = parseInt(usageCount || '0', 10);
      const total = parseInt(totalUpscaled || '0', 10);
      const remainingUpscales = UPSCALER_DAILY_LIMIT - usage;

      let username = 'Unknown';
      let email = 'Unknown';
      try {
        const user = await clerkClient.users.getUser(userId);
        username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
        email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
      }

      return { userId, username, email, remainingUpscales, usageCount: usage, totalUpscaledImages: total };
    }));

    const timeRemaining = getTimeRemaining();

    console.log("User Upscales Summary:");
    console.log("-----------------------------------------------------------------------------------------------------------------------------------------------------");
    console.log("User ID                          | Username       | Email                          | Remaining | Daily Upscaled | Total Upscaled | Time Until Reset");
    console.log("-----------------------------------------------------------------------------------------------------------------------------------------------------");

    userUpscales.forEach(({ userId, username, email, remainingUpscales, usageCount, totalUpscaledImages }) => {
      console.log(
        `${userId.padEnd(22)} | ${username.padEnd(14)} | ${email.padEnd(30)} | ${
          String(remainingUpscales).padStart(9)
        } | ${String(usageCount).padStart(14)} | ${String(totalUpscaledImages).padStart(14)} | ${timeRemaining}`
      );
    });
    console.log("-----------------------------------------------------------------------------------------------------------------------------------------------------");

    const totalUsers = userUpscales.length;
    const totalUpscaled = userUpscales.reduce((sum, user) => sum + user.totalUpscaledImages, 0);
    const totalRemaining = userUpscales.reduce((sum, user) => sum + user.remainingUpscales, 0);
    const totalCost = Number((totalUpscaled * 0.0017).toFixed(4)).toString(); // Calculate total cost

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
  } finally {
    await redisClient.quit();
  }
}

viewUserUpscales();