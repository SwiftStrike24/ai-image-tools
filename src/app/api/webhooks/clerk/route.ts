import { NextResponse } from 'next/server';
import { Webhook, WebhookRequiredHeaders } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUserInSupabase, updateUserInSupabase, deleteUserFromSupabase, logSessionCreated } from '@/lib/supabase';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const payload = await req.json();
  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 400 });
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
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        const { id, email_addresses, username } = evt.data;
        const primaryEmail = email_addresses[0]?.email_address;
        if (id && primaryEmail) {
          await createUserInSupabase(id, primaryEmail, username || '');
        }
        break;

      case 'user.updated':
        const updatedUser = evt.data;
        const updatedEmail = updatedUser.email_addresses[0]?.email_address;
        if (updatedUser.id && updatedEmail) {
          await updateUserInSupabase(updatedUser.id, updatedEmail, updatedUser.username || '');
        }
        break;

      case 'user.deleted':
        if (typeof evt.data.id === 'string') {
          await deleteUserFromSupabase(evt.data.id);
        }
        break;

      case 'session.created':
        if (typeof evt.data.user_id === 'string') {
          await logSessionCreated(evt.data.user_id);
        }
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }
}