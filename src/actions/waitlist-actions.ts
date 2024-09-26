"use server";

import { getRedisClient } from "@/lib/redis";
import { RedisClientType } from 'redis';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function addToWaitlist(email: string) {
  if (!isValidEmail(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  let redisClient: RedisClientType | null = null;
  try {
    redisClient = await getRedisClient();
    const waitlistKey = "waitlist";
    const alreadyExists = await redisClient.sIsMember(waitlistKey, email);

    if (alreadyExists) {
      return { success: false, message: "You're already on the waitlist. We'll be in touch soon!" };
    }

    await redisClient.sAdd(waitlistKey, email);
    console.log(`Added email to waitlist: ${email}`); // Add this line for debugging
    return { success: true, message: "You've successfully joined the waitlist. We're excited to have you on board!" };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return { success: false, message: "Oops! Something went wrong on our end. Please try again later." };
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}

export async function getWaitlistEmails() {
  let redisClient: RedisClientType | null = null;
  try {
    redisClient = await getRedisClient();
    const waitlistKey = "waitlist";
    const emails = await redisClient.sMembers(waitlistKey);
    console.log(`Retrieved ${emails.length} emails from waitlist`); // Add this line for debugging
    return { success: true, emails };
  } catch (error) {
    console.error("Error fetching waitlist emails:", error);
    return { success: false, error: "Failed to fetch waitlist emails" };
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}