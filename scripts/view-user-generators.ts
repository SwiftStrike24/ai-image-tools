import { config } from 'dotenv';
import { kv } from "@vercel/kv";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { GENERATOR_DAILY_LIMIT, GENERATOR_KEY_PREFIX } from "../src/constants/rateLimits";

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

async function viewUserGenerators() {
  try {
    const keys = await kv.keys(`${GENERATOR_KEY_PREFIX}*`);
    const userKeys = keys.filter(key => !key.endsWith(':date') && !key.endsWith(':total')); // {{ edit_4 }}

    const userGenerators = await Promise.all(userKeys.map(async (key) => {
      const userId = key.replace(GENERATOR_KEY_PREFIX, '');
      const [usageCount, lastUsageDate, totalGenerated] = await kv.mget([key, `${key}:date`, `${key}:total`]); // {{ edit_5 }}
      const usage = typeof usageCount === 'number' ? usageCount : 0;
      const total = typeof totalGenerated === 'number' ? totalGenerated : 0; // {{ edit_6 }}
      const remainingGenerations = GENERATOR_DAILY_LIMIT - usage;
      const totalGeneratedImages = total;

      let username = 'Unknown';
      let email = 'Unknown';
      try {
        const user = await clerkClient.users.getUser(userId);
        username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
        email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
      }

      return { userId, username, email, remainingGenerations, usageCount, totalGeneratedImages }; // {{ edit_9 }}
    }));

    const timeRemaining = getTimeRemaining();

    console.log("User Generator Usage Summary:");
    console.log("---------------------------------------------------------------------------------------------------------------------------------------------");
    console.log("User ID                          | Username       | Email                  | Remaining | Daily Generated | Total Generated | Time Until Reset"); // {{ edit_10 }}
    console.log("---------------------------------------------------------------------------------------------------------------------------------------------");

    userGenerators.forEach(({ userId, username, email, remainingGenerations, usageCount, totalGeneratedImages }) => { // {{ edit_11 }}
      console.log(
        `${userId.padEnd(22)} | ${username.padEnd(14)} | ${email.padEnd(22)} | ${
          String(remainingGenerations).padStart(9)
        } | ${String(usageCount).padStart(15)} | ${String(totalGeneratedImages).padStart(16)} | ${timeRemaining}` // {{ edit_12 }}
      );
    });
    console.log("---------------------------------------------------------------------------------------------------------------------------------------------");

    const totalUsers = userGenerators.length;
    const totalGenerated = userGenerators.reduce((sum, user) => sum + user.totalGeneratedImages, 0); // {{ edit_7 }}
    const totalRemaining = userGenerators.reduce((sum, user) => sum + user.remainingGenerations, 0); // {{ edit_8 }}
    const totalCost = Number((totalGenerated * 0.003).toFixed(4)).toString(); // Calculate total cost

    console.log(`\nSummary:`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total images generated: ${totalGenerated}`);
    console.log(`Total remaining generations: ${totalRemaining}`);
    console.log(`Total cost of generated images: $${totalCost}`);
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