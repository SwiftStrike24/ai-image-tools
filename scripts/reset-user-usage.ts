import dotenv from 'dotenv';
import { kv } from "@vercel/kv";
import inquirer from 'inquirer';
import path from 'path';
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
      kv.del(`${UPSCALER_KEY_PREFIX}${userId}`),
      kv.del(`${UPSCALER_KEY_PREFIX}${userId}:date`),
      kv.del(`${UPSCALER_KEY_PREFIX}${userId}:total`)
    );
  }

  if (resetOption === 'generators' || resetOption === 'both') {
    tasks.push(
      kv.del(`${GENERATOR_KEY_PREFIX}${userId}`),
      kv.del(`${GENERATOR_KEY_PREFIX}${userId}:date`),
      kv.del(`${GENERATOR_KEY_PREFIX}${userId}:total`)
    );
  }

  try {
    await Promise.all(tasks);
    console.log('Usage reset successfully.');
  } catch (error) {
    console.error('Error resetting usage:', error);
  }
}

resetUserUsage();