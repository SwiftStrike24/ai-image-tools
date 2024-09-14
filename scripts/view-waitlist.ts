import { config } from 'dotenv';
import { kv } from "@vercel/kv";

// Load environment variables from .env.local
config({ path: '.env.local' });

async function viewWaitlist() {
  const waitlistKey = "waitlist";
  try {
    const emails = await kv.smembers(waitlistKey);
    console.log("Waitlist emails:", emails);
  } catch (error) {
    console.error("Error fetching waitlist:", error);
  }
}

viewWaitlist();