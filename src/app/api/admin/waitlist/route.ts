import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  const waitlistKey = "waitlist";
  const emails = await kv.smembers(waitlistKey);
  return NextResponse.json({ emails });
}