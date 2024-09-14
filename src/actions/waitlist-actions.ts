"use server";

import { kv } from "@vercel/kv";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function addToWaitlist(email: string) {
  if (!isValidEmail(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  try {
    const waitlistKey = "waitlist";
    const alreadyExists = await kv.sismember(waitlistKey, email);

    if (alreadyExists) {
      return { success: false, message: "You're already on the waitlist. We'll be in touch soon!" };
    }

    await kv.sadd(waitlistKey, email);
    return { success: true, message: "You've successfully joined the waitlist. We're excited to have you on board!" };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return { success: false, message: "Oops! Something went wrong on our end. Please try again later." };
  }
}