import { NextResponse } from 'next/server';
import { Webhook, WebhookRequiredHeaders } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { deleteUserFromSupabase } from '@/lib/supabase';
import { getRedisClient } from "@/lib/redis";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const payload = await req.json();
  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Error occurred -- no svix headers' }, { status: 400 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Error occurred -- no webhook secret' }, { status: 400 });
  }

  const svixHeaders: WebhookRequiredHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(JSON.stringify(payload), svixHeaders) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Error occurred' }, { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (typeof id === 'string') {
      try {
        // Delete user data from Supabase
        await deleteUserFromSupabase(id);
        console.log(`User ${id} and related data deleted from Supabase`);

        // Delete user data from Redis
        const redisClient = await getRedisClient();
        await redisClient.del(`user_subscription:${id}`);
        await redisClient.del(`stripe_customer:${id}`);
        console.log(`User ${id} data deleted from Redis`);

        return NextResponse.json({ message: 'User deleted successfully from Supabase and Redis' }, { status: 200 });
      } catch (error) {
        console.error('Error deleting user data:', error);
        return NextResponse.json({ error: 'Error deleting user data' }, { status: 500 });
      }
    } else {
      console.error('Invalid user ID in webhook payload');
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
  }

  return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
}