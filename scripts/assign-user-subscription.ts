import dotenv from 'dotenv';
import { kv } from "@vercel/kv";
import inquirer from 'inquirer';
import { clerkClient } from "@clerk/clerk-sdk-node";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

async function assignUserSubscription() {
  const { userId } = await inquirer.prompt({
    type: 'input',
    name: 'userId',
    message: 'Enter the User ID to assign subscription:',
    validate: (input: string) => input.trim() !== '' || 'User ID cannot be empty',
  });

  const { subscriptionType } = await inquirer.prompt({
    type: 'list',
    name: 'subscriptionType',
    message: 'Select the subscription type:',
    choices: ['basic', 'pro', 'premium', 'ultimate'],
  });

  try {
    // Fetch user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
    const email = user.emailAddresses[0]?.emailAddress || 'Unknown';

    // Assign subscription in Vercel KV
    const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
    await kv.set(subscriptionKey, subscriptionType);

    console.log('\nSubscription Assigned Successfully:');
    console.log(`User ID: ${userId}`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Assigned Subscription: ${subscriptionType}`);

  } catch (error) {
    console.error('Error assigning user subscription:', error);
  }
}

assignUserSubscription();