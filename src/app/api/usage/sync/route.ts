import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserUsage, getUserUsage, createUserUsage } from '@/lib/supabaseAdmin';
import { UsageData } from '@/stores/subscriptionStore';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const clientUsage = body as UsageData;

    let currentUsage = await getUserUsage(userId);

    if (!currentUsage) {
      currentUsage = await createUserUsage(userId);
    }

    const updatedUsage: UsageData = {
      generator: Math.max(clientUsage.generator, currentUsage.generator),
      upscaler: Math.max(clientUsage.upscaler, currentUsage.upscaler),
      enhance_prompt: Math.max(clientUsage.enhance_prompt, currentUsage.enhance_prompt),
    };

    const result = await updateUserUsage(userId, updatedUsage);
    console.log('Usage sync result:', JSON.stringify(result, null, 2));

    return NextResponse.json({ success: true, updatedUsage: result });
  } catch (error: any) {
    console.error('Error syncing usage data:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usage = await getUserUsage(userId);
    return NextResponse.json({ success: true, usage });
  } catch (error: any) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
