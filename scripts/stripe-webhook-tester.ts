import chalk from 'chalk';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookUrl = 'http://192.168.1.81:3000/api/webhooks/stripe';
const stripePath = 'E:\\services\\stripe_1.21.8_windows_x86_64\\stripe.exe';

const events = [
  { name: 'customer.created', emoji: '👤' },
  { name: 'customer.subscription.created', emoji: '🆕' },
  { name: 'customer.subscription.updated', emoji: '🔄' },
  { name: 'customer.subscription.deleted', emoji: '🗑️' },
  { name: 'checkout.session.completed', emoji: '✅' },
  { name: 'invoice.payment_succeeded', emoji: '💰' },
  { name: 'customer.deleted', emoji: '👤❌' },
  { name: 'subscription_schedule.canceled', emoji: '📅❌' },
  { name: 'subscription_schedule.created', emoji: '📅✅' },
];

const plans = [
  { name: 'Pro', priceId: 'price_1Q3AztHYPfrMrymk4VqOuNAD' },
  { name: 'Premium', priceId: 'price_1Q3B16HYPfrMrymkgzihBxJR' },
  { name: 'Ultimate', priceId: 'price_1Q3B2gHYPfrMrymkYyJgjmci' },
];

const subscriptionFlows = [
  {
    name: 'New Subscription',
    emoji: '🔔',
    events: [
      'customer.subscription.created',
      'checkout.session.completed',
      'invoice.payment_succeeded',
    ],
  },
  {
    name: 'Upgrade Subscription',
    emoji: '⬆️',
    events: ['customer.subscription.updated', 'invoice.payment_succeeded'],
  },
  {
    name: 'Schedule Upgrade',
    emoji: '📅⬆️',
    events: ['subscription_schedule.created'],
  },
  {
    name: 'Cancel Scheduled Upgrade',
    emoji: '❌📅⬆️',
    events: ['subscription_schedule.canceled'],
  },
  {
    name: 'Downgrade Subscription',
    emoji: '⬇️',
    events: ['subscription_schedule.created'],
  },
  {
    name: 'Cancel Scheduled Downgrade',
    emoji: '❌📅⬇️',
    events: ['subscription_schedule.canceled'],
  },
  {
    name: 'Cancel Subscription',
    emoji: '🚫',
    events: ['customer.subscription.deleted'],
  },
  {
    name: 'Renew Subscription',
    emoji: '🔁',
    events: ['invoice.payment_succeeded'],
  },
  { name: 'Delete Customer', emoji: '🗑️', events: ['customer.deleted'] },
];

let stripeListenProcess: ChildProcessWithoutNullStreams | null = null;

async function checkStripeCliInstallation() {
  return new Promise<boolean>((resolve) => {
    const proc = spawn(stripePath, ['--version']);

    proc.on('error', () => {
      console.error(chalk.red('Stripe CLI is not found at the specified path.'));
      console.log(chalk.yellow('Please ensure the Stripe CLI is installed at:'));
      console.log(chalk.cyan(stripePath));
      resolve(false);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✓ Stripe CLI is installed'));
        resolve(true);
      } else {
        console.error(chalk.red('Stripe CLI is not found at the specified path.'));
        resolve(false);
      }
    });
  });
}

async function checkStripeLogin() {
  return new Promise<boolean>((resolve) => {
    const proc = spawn(stripePath, ['listen', '--print-secret']);

    proc.stdout.on('data', (data) => {
      if (data.toString().trim()) {
        console.log(chalk.green('✓ Stripe CLI is ready'));
        proc.kill();
        resolve(true);
      }
    });

    proc.stderr.on('data', (data) => {
      console.error(
        chalk.red("Error accessing Stripe CLI. Please ensure you're logged in.")
      );
      console.log(chalk.yellow(`Run "${stripePath}" login and try again`));
      resolve(false);
    });

    proc.on('error', () => {
      console.error(chalk.red('Failed to start stripe listen'));
      resolve(false);
    });
  });
}

async function startStripeListen() {
  return new Promise<void>((resolve, reject) => {
    stripeListenProcess = spawn(stripePath, ['listen', '--forward-to', webhookUrl]);

    const onData = (data: Buffer) => {
      const message = data.toString();
      console.log(chalk.gray(`stripe listen: ${message}`));
      // Wait until the listener is ready before resolving
      if (message.includes('Ready')) {
        resolve();
      }
    };

    stripeListenProcess.stdout.on('data', onData);
    stripeListenProcess.stderr.on('data', onData);

    stripeListenProcess.on('error', (err) => {
      console.error(chalk.red('Failed to start stripe listen'));
      reject(err);
    });

    stripeListenProcess.on('close', (code) => {
      console.log(chalk.yellow(`stripe listen process exited with code ${code}`));
    });
  });
}

async function runTest(event: string, emoji: string, overrides: any = {}) {
  console.log(chalk.cyan(`\n${emoji} Testing ${event}...`));
  return new Promise<boolean>((resolve) => {
    try {
      const args = ['trigger', event];
      Object.entries(overrides).forEach(([key, value]) => {
        args.push('--override');
        args.push(`${key}=${String(value)}`);
      });
      console.log(chalk.gray(`Executing: "${stripePath}" ${args.join(' ')}`));
      const proc = spawn(stripePath, args);

      proc.stdout.on('data', (data) => {
        console.log(chalk.gray(`Output: ${data.toString()}`));
      });

      proc.stderr.on('data', (data) => {
        console.error(chalk.red(`Error Output: ${data.toString()}`));
      });

      proc.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✓ Event sent successfully'));
          resolve(true);
        } else {
          console.error(chalk.red(`Command exited with code ${code}`));
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        console.error(chalk.red(`Failed to start process: ${err.message}`));
        resolve(false);
      });
    } catch (error) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
      resolve(false);
    }
  });
}

async function runSubscriptionFlow(
  flow: {
    name: string;
    emoji: string;
    events: string[];
  },
  userId: string,
  customerId: string,
  subscriptionId: string,
  currentPlan: string,
  newPlan: string
) {
  console.log(
    chalk.bold.magenta(`\n${flow.emoji} Testing ${flow.name} Flow for Bob Stein`)
  );
  let flowSuccess = true;

  for (const eventName of flow.events) {
    const event = events.find((e) => e.name === eventName);
    if (event) {
      const overrides: { [key: string]: string } = {};

      // Event-specific overrides
      switch (event.name) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          overrides['subscription:customer'] = customerId;
          // Removed 'customer:id' override to prevent 'resource_already_exists' error
          // overrides['customer:id'] = customerId;
          overrides['subscription:metadata[userId]'] = userId;
          overrides['subscription:metadata[username]'] = 'Bob Stein';
          overrides['subscription:metadata[currentPlan]'] = currentPlan;
          overrides['subscription:metadata[newPlan]'] = newPlan;
          break;
        case 'invoice.payment_succeeded':
          overrides['invoice:customer'] = customerId;
          // Removed 'customer:id' override
          // overrides['customer:id'] = customerId;
          overrides['invoice:metadata[userId]'] = userId;
          overrides['invoice:metadata[username]'] = 'Bob Stein';
          break;
        case 'checkout.session.completed':
          overrides['checkout_session:customer'] = customerId;
          // Removed 'customer:id' override
          // overrides['customer:id'] = customerId;
          overrides['checkout_session:metadata[userId]'] = userId;
          overrides['checkout_session:metadata[username]'] = 'Bob Stein';
          break;
        case 'subscription_schedule.created':
        case 'subscription_schedule.canceled':
          overrides['subscription_schedule:metadata[userId]'] = userId;
          overrides['subscription_schedule:metadata[username]'] = 'Bob Stein';
          overrides['subscription_schedule:metadata[currentPlan]'] = currentPlan;
          overrides['subscription_schedule:metadata[newPlan]'] = newPlan;
          break;
        case 'customer.deleted':
          overrides['customer:id'] = customerId;
          break;
        default:
          break;
      }

      const success = await runTest(event.name, event.emoji, overrides);
      if (!success) flowSuccess = false;
    }
  }

  if (flowSuccess) {
    console.log(
      chalk.bold.green(`\n✅ ${flow.name} Flow completed successfully for Bob Stein`)
    );
  } else {
    console.log(
      chalk.bold.red(`\n❌ ${flow.name} Flow encountered issues for Bob Stein`)
    );
  }

  return flowSuccess;
}

async function runAllTests() {
  console.log(
    chalk.bold.yellow('🚀 Starting Stripe Webhook Tests for Bob Stein 🚀\n')
  );

  // Add a check for the Stripe API key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(chalk.red('Error: STRIPE_SECRET_KEY is not set in the environment variables.'));
    return;
  }

  const isStripeCliInstalled = await checkStripeCliInstallation();
  if (!isStripeCliInstalled) {
    return;
  }

  const isLoggedIn = await checkStripeLogin();
  if (!isLoggedIn) {
    return;
  }

  // Start stripe listen
  await startStripeListen();

  // Add a small delay to ensure any background processes complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let successCount = 0;
  let failCount = 0;

  const userId = uuidv4();
  let subscriptionId = ''; // Initialize empty subscription ID
  let currentPlan = 'Basic';

  console.log(chalk.blue(`\nCreating test user: Bob Stein (ID: ${userId})`));

  // Create customer via API
  let customer;
  try {
    customer = await stripe.customers.create({
      email: `bob_${userId}@example.com`,
      metadata: {
        userId: userId,
        username: 'Bob Stein',
      },
    });
    console.log(chalk.green(`Customer created with ID: ${customer.id}`));
  } catch (error) {
    console.error(chalk.red('Failed to create customer via Stripe API.'));
    console.error(error);
    return;
  }

  const customerId = customer.id;

  for (const flow of subscriptionFlows) {
    let newPlan = currentPlan;

    // Update metadata for specific flows
    if (flow.name === 'New Subscription') {
      newPlan = plans[0].name; // Start with Pro plan
    } else if (flow.name === 'Upgrade Subscription') {
      const currentIndex = plans.findIndex((p) => p.name === currentPlan);
      newPlan = plans[currentIndex + 1]?.name || currentPlan;
    } else if (flow.name === 'Downgrade Subscription') {
      const currentIndex = plans.findIndex((p) => p.name === currentPlan);
      newPlan = plans[Math.max(0, currentIndex - 1)]?.name || currentPlan;
    }

    const success = await runSubscriptionFlow(
      flow,
      userId,
      customerId,
      subscriptionId,
      currentPlan,
      newPlan
    );
    if (success) {
      successCount++;
      currentPlan = newPlan; // Update current plan if flow was successful
    } else {
      failCount++;
    }

    // Add delays between flows to simulate real-world scenarios
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(chalk.bold.yellow('\n🏁 Test Results 🏁'));
  console.log(chalk.green(`✅ Successful flows: ${successCount}`));
  console.log(chalk.red(`❌ Failed flows: ${failCount}`));
  console.log(chalk.cyan(`🎯 Total flows: ${subscriptionFlows.length}`));

  const successRate = (successCount / subscriptionFlows.length) * 100;
  console.log(chalk.bold(`\n📊 Success Rate: ${successRate.toFixed(2)}%`));

  if (successRate === 100) {
    console.log(
      chalk.bold.green('\n🎉 All subscription flows passed successfully! 🎉')
    );
  } else if (successRate >= 80) {
    console.log(
      chalk.bold.yellow('\n🔨 Most flows passed. Some issues to address. 🔨')
    );
  } else {
    console.log(
      chalk.bold.red('\n🚨 Several flows failed. Please review and fix issues. 🚨')
    );
  }

  // Stop stripe listen
  if (stripeListenProcess) {
    stripeListenProcess.kill();
  }
}

// Handle script exit to clean up stripe listen process
process.on('exit', () => {
  if (stripeListenProcess) {
    stripeListenProcess.kill();
  }
});

process.on('SIGINT', () => {
  if (stripeListenProcess) {
    stripeListenProcess.kill();
  }
  process.exit();
});

process.on('SIGTERM', () => {
  if (stripeListenProcess) {
    stripeListenProcess.kill();
  }
  process.exit();
});

runAllTests().catch(console.error);
