import { NextResponse } from 'next/server';
import { Webhook, WebhookRequiredHeaders } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUserInSupabase, updateUserInSupabase, deleteUserFromSupabase, logSessionCreated } from '@/lib/supabase';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  console.log('[INFO] Webhook received');
  try {
    // Get the raw body as a string
    const rawBody = await req.text();
    console.log('[DEBUG] Raw body:', rawBody.substring(0, 100) + '...');

    const headerPayload = headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    console.log('[DEBUG] Webhook headers:', { svixId, svixTimestamp, svixSignature: svixSignature?.substring(0, 10) + '...' });

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[ERROR] Missing svix headers');
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('[ERROR] Missing webhook secret');
      return NextResponse.json({ error: 'Missing webhook secret' }, { status: 400 });
    }

    const svixHeaders: WebhookRequiredHeaders = {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    };

    console.log('[INFO] Verifying webhook signature');
    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(rawBody, svixHeaders) as WebhookEvent;
      console.log('[INFO] Webhook signature verified successfully');
    } catch (err) {
      console.error('[ERROR] Invalid signature:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const eventType = evt.type;
    console.log(`[INFO] Processing event type: ${eventType}`);

    try {
      switch (eventType) {
        case 'user.created':
          console.log('[INFO] Handling user.created event');
          const { id, email_addresses, username } = evt.data;
          const primaryEmail = email_addresses[0]?.email_address;
          if (id && primaryEmail) {
            await createUserInSupabase(id, primaryEmail, username || '');
            console.log(`[INFO] User created in Supabase: ${id}`);
          }
          break;

        case 'user.updated':
          console.log('[INFO] Handling user.updated event');
          const updatedUser = evt.data;
          const updatedEmail = updatedUser.email_addresses[0]?.email_address;
          if (updatedUser.id && updatedEmail) {
            await updateUserInSupabase(updatedUser.id, updatedEmail, updatedUser.username || '');
            console.log(`[INFO] User updated in Supabase: ${updatedUser.id}`);
          }
          break;

        case 'user.deleted':
          console.log('[INFO] Handling user.deleted event');
          if (typeof evt.data.id === 'string') {
            await deleteUserFromSupabase(evt.data.id);
            console.log(`[INFO] User deleted from Supabase: ${evt.data.id}`);
          }
          break;

        case 'session.created':
          console.log('[INFO] Handling session.created event');
          if (typeof evt.data.user_id === 'string') {
            await logSessionCreated(evt.data.user_id);
            console.log(`[INFO] Session created logged for user: ${evt.data.user_id}`);
          }
          break;

        default:
          console.log(`[INFO] Unhandled event type: ${eventType}`);
      }

      console.log('[INFO] Webhook processed successfully');
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('[ERROR] Error processing webhook:', error);
      return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
    }
  } catch (error) {
    console.error('[ERROR] Unexpected error in webhook handler:', error);
    return NextResponse.json({ error: 'Unexpected error in webhook handler' }, { status: 500 });
  }
}