import { config } from 'dotenv';
import { kv } from "@vercel/kv";

// Load environment variables from .env.local
config({ path: '.env.local' });

async function clearWaitlist() {
  const waitlistKey = "waitlist";
  try {
    await kv.del(waitlistKey);
    console.log("Waitlist cleared successfully.");
  } catch (error) {
    console.error("Error clearing waitlist:", error);
  }
}

clearWaitlist();
