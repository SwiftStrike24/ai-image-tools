import dotenv from 'dotenv';
import { kv } from "@vercel/kv";
import inquirer from 'inquirer';
import { ENHANCE_PROMPT_KEY_PREFIX } from "../src/constants/rateLimits";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function resetUserEnhancePrompts() {
  const { userId } = await inquirer.prompt({
    type: 'input',
    name: 'userId',
    message: 'Enter the User ID:',
    validate: (input: string) => input.trim() !== '' || 'User ID cannot be empty',
  });

  // Check if the user exists
  const enhancePromptKey = `${ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  
  const enhancePromptExists = await kv.exists(enhancePromptKey);

  if (!enhancePromptExists) {
    console.error('Error: User ID does not exist or has no enhance prompt usage.');
    process.exit(1);
  }

  const { confirmReset } = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmReset',
    message: 'Are you sure you want to reset the enhance prompt usage for this user?',
    default: false,
  });

  if (!confirmReset) {
    console.log('Reset cancelled.');
    process.exit(0);
  }

  try {
    await Promise.all([
      kv.del(`${ENHANCE_PROMPT_KEY_PREFIX}${userId}`),
      kv.del(`${ENHANCE_PROMPT_KEY_PREFIX}${userId}:date`),
      kv.del(`${ENHANCE_PROMPT_KEY_PREFIX}${userId}:total`),
      kv.del(`${ENHANCE_PROMPT_KEY_PREFIX}${userId}:model`)
    ]);
    console.log('Enhance prompt usage reset successfully.');
  } catch (error) {
    console.error('Error resetting enhance prompt usage:', error);
  }
}

resetUserEnhancePrompts();