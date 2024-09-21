import dotenv from 'dotenv';
import { kv } from "@vercel/kv";
import inquirer from 'inquirer';
import { clerkClient } from "@clerk/clerk-sdk-node";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

async function checkUserSubscription() {
  const { userId } = await inquirer.prompt({
    type: 'input',
    name: 'userId',
    message: 'Enter the User ID to check subscription:',
    validate: (input: string) => input.trim() !== '' || 'User ID cannot be empty',
  });

  try {
    // Fetch user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
    const email = user.emailAddresses[0]?.emailAddress || 'Unknown';

    // Check subscription in Vercel KV
    const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
    const subscription = await kv.get(subscriptionKey);

    console.log('\nUser Details:');
    console.log(`User ID: ${userId}`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Subscription: ${subscription || 'No active subscription'}`);

  } catch (error) {
    console.error('Error checking user subscription:', error);
  }
}

checkUserSubscription();