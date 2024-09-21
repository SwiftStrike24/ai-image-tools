import dotenv from 'dotenv';
import { kv } from "@vercel/kv";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

interface SubscriptionSummary {
  [key: string]: number;
}

async function checkAllUserSubscriptions() {
  try {
    // Fetch all users from Clerk
    const users = await clerkClient.users.getUserList();

    console.log('\nUser Subscriptions:');
    console.log('-----------------------------------------------------------------------------------------------------');
    console.log('User ID                           | Username          | Email                          | Subscription');
    console.log('-----------------------------------------------------------------------------------------------------');

    const subscriptionSummary: SubscriptionSummary = {
      basic: 0,
      pro: 0,
      premium: 0,
      ultimate: 0,
    };

    let totalUsers = 0;
    let activeUsers = 0;

    for (const user of users.data) {
      const userId = user.id;
      const username = user.username || `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
      const email = user.emailAddresses[0]?.emailAddress || 'Unknown';

      // Check subscription in Vercel KV
      const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
      const subscription = (await kv.get(subscriptionKey) as string) || 'basic';

      console.log(`${userId.padEnd(32)} | ${username.padEnd(18)} | ${email.padEnd(30)} | ${subscription}`);

      subscriptionSummary[subscription] = (subscriptionSummary[subscription] || 0) + 1;
      totalUsers++;

      if (user.lastSignInAt) {
        const lastSignIn = new Date(user.lastSignInAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (lastSignIn > thirtyDaysAgo) {
          activeUsers++;
        }
      }
    }

    console.log('-----------------------------------------------------------------------------------------------------');

    // Print summary
    console.log('\nSubscription Summary:');
    console.log('-----------------------------------------------------------------------------------------------------');
    for (const [plan, count] of Object.entries(subscriptionSummary)) {
      console.log(`${plan.charAt(0).toUpperCase() + plan.slice(1)} users: ${count}`);
    }
    console.log('-----------------------------------------------------------------------------------------------------');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Active users (last 30 days): ${activeUsers}`);
    console.log(`Inactive users: ${totalUsers - activeUsers}`);
    
    // Calculate percentages
    const activePercentage = ((activeUsers / totalUsers) * 100).toFixed(2);
    console.log(`Active user percentage: ${activePercentage}%`);
    
    console.log('\nSubscription Distribution:');
    for (const [plan, count] of Object.entries(subscriptionSummary)) {
      const percentage = ((count / totalUsers) * 100).toFixed(2);
      console.log(`${plan.charAt(0).toUpperCase() + plan.slice(1)}: ${percentage}%`);
    }

  } catch (error) {
    console.error('Error checking user subscriptions:', error);
  }
}

checkAllUserSubscriptions();