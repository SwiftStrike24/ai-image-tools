import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { getRedisClient } from "../src/lib/redis";
import { UPSCALER_KEY_PREFIX, GENERATOR_KEY_PREFIX } from "../src/constants/rateLimits";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function resetUserUsage() {
  const { userId } = await inquirer.prompt({
    type: 'input',
    name: 'userId',
    message: 'Enter the User ID:',
    validate: (input: string) => input.trim() !== '' || 'User ID cannot be empty',
  });

  let redisClient;
  try {
    redisClient = await getRedisClient();

    // Check if the user exists
    const upscalerKey = `${UPSCALER_KEY_PREFIX}${userId}`;
    const generatorKey = `${GENERATOR_KEY_PREFIX}${userId}`;
    
    const [upscalerExists, generatorExists] = await Promise.all([
      redisClient.exists(upscalerKey),
      redisClient.exists(generatorKey)
    ]);

    if (!upscalerExists && !generatorExists) {
      console.error('Error: User ID does not exist.');
      return;
    }

    const { resetOption } = await inquirer.prompt({
      type: 'list',
      name: 'resetOption',
      message: 'Select an option to reset:',
      choices: [
        { name: 'Reset daily usage for Upscales only', value: 'upscales' },
        { name: 'Reset daily usage for Generators only', value: 'generators' },
        { name: 'Reset daily usage for both Upscales and Generators', value: 'both' },
      ],
    });

    const tasks = [];

    if (resetOption === 'upscales' || resetOption === 'both') {
      tasks.push(
        redisClient.del(`${UPSCALER_KEY_PREFIX}${userId}`),
        redisClient.del(`${UPSCALER_KEY_PREFIX}${userId}:date`),
        redisClient.del(`${UPSCALER_KEY_PREFIX}${userId}:total`)
      );
    }

    if (resetOption === 'generators' || resetOption === 'both') {
      tasks.push(
        redisClient.del(`${GENERATOR_KEY_PREFIX}${userId}`),
        redisClient.del(`${GENERATOR_KEY_PREFIX}${userId}:date`),
        redisClient.del(`${GENERATOR_KEY_PREFIX}${userId}:total`)
      );
    }

    await Promise.all(tasks);
    console.log('Usage reset successfully.');
  } catch (error) {
    console.error('Error resetting usage:', error);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}

resetUserUsage();