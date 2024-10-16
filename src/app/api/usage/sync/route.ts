import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserUsage, getUserUsage, createUserUsage } from '@/lib/supabase';
import { UsageData } from '@/stores/subscriptionStore';

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { generator, upscaler, enhance_prompt } = body as UsageData;

    let currentUsage = await getUserUsage(userId);

    if (!currentUsage) {
      currentUsage = await createUserUsage(userId);
    }

    // Ensure all values are numbers
    const updatedUsage: UsageData = {
      generator: Number(generator) || 0,
      upscaler: Number(upscaler) || 0,
      enhance_prompt: Number(enhance_prompt) || 0,
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
