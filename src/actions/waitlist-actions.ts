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
      return { success: false, message: "This email is already on the waitlist." };
    }

    await kv.sadd(waitlistKey, email);
    return { success: true, message: "Successfully added to the waitlist!" };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return { success: false, message: "An error occurred. Please try again later." };
  }
}