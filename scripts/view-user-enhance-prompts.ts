import { config } from 'dotenv';
import { clerkClient } from "@clerk/clerk-sdk-node";
import { ENHANCE_PROMPT_DAILY_LIMIT, ENHANCE_PROMPT_KEY_PREFIX } from "../src/constants/rateLimits";
import { getRedisClient } from "../src/lib/redis";
import { RedisClientType } from 'redis';

config({ path: '.env.local' });

// Define an interface for the model counts
interface ModelCounts {
  'meta-llama-3-8b-instruct': number;
  'gpt-4o-mini': number;
}

function getTimeRemaining(): string {
  const now = new Date();
  const utcNow = new Date(now.toUTCString());
  const midnight = new Date(utcNow);
  midnight.setUTCHours(24, 0, 0, 0);
  const timeRemaining = midnight.getTime() - utcNow.getTime();
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Define pricing constants
const META_LLAMA_INPUT_PRICE = 0.05 / 1000000;  // $0.05 per 1M tokens
const META_LLAMA_OUTPUT_PRICE = 0.25 / 1000000; // $0.25 per 1M tokens
const GPT4_MINI_INPUT_PRICE = 0.15 / 1000000;   // $0.15 per 1M tokens
const GPT4_MINI_OUTPUT_PRICE = 0.60 / 1000000;  // $0.60 per 1M tokens

// Assume average token counts (you may want to adjust these based on actual usage)
const AVG_INPUT_TOKENS = 50;
const AVG_OUTPUT_TOKENS = 100;

async function viewUserEnhancePrompts() {
  let redisClient: RedisClientType | null = null;
  try {
    redisClient = await getRedisClient();
    const keys = await redisClient.keys(`${ENHANCE_PROMPT_KEY_PREFIX}*`);
    const userKeys = keys.filter(key => !key.endsWith(':date') && !key.endsWith(':total') && !key.endsWith(':model'));

    const userEnhancePrompts = await Promise.all(userKeys.map(async (key) => {
      const userId = key.replace(ENHANCE_PROMPT_KEY_PREFIX, '');
      const [usageCount, lastUsageDate, totalEnhanced, modelUsage] = await redisClient!.mGet([key, `${key}:date`, `${key}:total`, `${key}:model`]);
      const usage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
      const total = typeof totalEnhanced === 'string' ? parseInt(totalEnhanced, 10) : 0;
      const remainingEnhancements = ENHANCE_PROMPT_DAILY_LIMIT - usage;
      const totalEnhancedPrompts = total;
      const modelCounts: ModelCounts = typeof modelUsage === 'string' ? JSON.parse(modelUsage) : { 'meta-llama-3-8b-instruct': 0, 'gpt-4o-mini': 0 };

      let username = 'Unknown';
      let email = 'Unknown';
      try {
        const user = await clerkClient.users.getUser(userId);
        username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
        email = user.emailAddresses[0]?.emailAddress || 'Unknown';
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
      }

      return { userId, username, email, remainingEnhancements, usageCount: usage, totalEnhancedPrompts, modelCounts };
    }));

    const timeRemaining = getTimeRemaining();

    console.log("User Enhance Prompts Summary:");
    console.log("-----------------------------------------------------------------------------------------------------------------------------------------------------------");
    console.log("User ID                          | Username       | Email                          | Remaining | Daily Enhanced | Total Enhanced | Meta-Llama | GPT-4o-mini");
    console.log("-----------------------------------------------------------------------------------------------------------------------------------------------------------");

    userEnhancePrompts.forEach(({ userId, username, email, remainingEnhancements, usageCount, totalEnhancedPrompts, modelCounts }) => {
      console.log(
        `${userId.padEnd(22)} | ${username.padEnd(14)} | ${email.padEnd(30)} | ${
          String(remainingEnhancements).padStart(9)
        } | ${String(usageCount).padStart(15)} | ${String(totalEnhancedPrompts).padStart(15)} | ${
          String(modelCounts['meta-llama-3-8b-instruct']).padStart(10)
        } | ${String(modelCounts['gpt-4o-mini']).padStart(10)}`
      );
    });
    console.log("-----------------------------------------------------------------------------------------------------------------------------------------------------------");

    const totalUsers = userEnhancePrompts.length;
    const totalEnhanced = userEnhancePrompts.reduce((sum, user) => sum + user.totalEnhancedPrompts, 0);
    const totalRemaining = userEnhancePrompts.reduce((sum, user) => sum + user.remainingEnhancements, 0);
    
    const totalMetaLlama = userEnhancePrompts.reduce((sum, user) => sum + user.modelCounts['meta-llama-3-8b-instruct'], 0);
    const totalGPT4Mini = userEnhancePrompts.reduce((sum, user) => sum + user.modelCounts['gpt-4o-mini'], 0);
    
    const metaLlamaCost = totalMetaLlama * (META_LLAMA_INPUT_PRICE * AVG_INPUT_TOKENS + META_LLAMA_OUTPUT_PRICE * AVG_OUTPUT_TOKENS);
    const gpt4MiniCost = totalGPT4Mini * (GPT4_MINI_INPUT_PRICE * AVG_INPUT_TOKENS + GPT4_MINI_OUTPUT_PRICE * AVG_OUTPUT_TOKENS);
    const totalCost = metaLlamaCost + gpt4MiniCost;

    console.log(`\nSummary:`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total prompts enhanced: ${totalEnhanced}`);
    console.log(`Total remaining enhancements: ${totalRemaining}`);
    console.log(`Meta-Llama enhancements: ${totalMetaLlama}`);
    console.log(`GPT-4o-mini enhancements: ${totalGPT4Mini}`);
    console.log(`Estimated cost of Meta-Llama enhancements: $${metaLlamaCost.toFixed(4)}`);
    console.log(`Estimated cost of GPT-4o-mini enhancements: $${gpt4MiniCost.toFixed(4)}`);
    console.log(`Total estimated cost of enhanced prompts: $${totalCost.toFixed(4)}`);
    console.log(`Time until reset: ${timeRemaining}`);

    // Find users close to their limit
    const usersNearLimit = userEnhancePrompts.filter(user => user.remainingEnhancements <= 5);
    if (usersNearLimit.length > 0) {
      console.log("\nUsers with 5 or fewer enhancements remaining:");
      usersNearLimit.forEach(user => {
        console.log(`- ${user.username} (${user.email}): ${user.remainingEnhancements} remaining`);
      });
    }

  } catch (error) {
    console.error("Error fetching user enhance prompts usage:", error);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}

viewUserEnhancePrompts();