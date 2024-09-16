import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  const waitlistKey = "waitlist";
  try {
    console.log("Attempting to fetch emails from KV store");
    const emails = await kv.smembers(waitlistKey);
    console.log("Fetched emails:", emails);
    
    if (!emails || emails.length === 0) {
      console.log("No emails found in KV store");
    }

    return NextResponse.json({ emails, debug: process.env.KV_URL ? "KV_URL is set" : "KV_URL is not set" });
  } catch (error) {
    console.error("Error fetching waitlist emails:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist emails", debug: process.env.KV_URL ? "KV_URL is set" : "KV_URL is not set" }, { status: 500 });
  }
}