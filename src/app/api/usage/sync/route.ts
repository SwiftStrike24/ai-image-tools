import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserUsage, getUserUsage, createUserUsage } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let currentUsage = await getUserUsage(userId);

    if (!currentUsage) {
      // If no usage data found, create a new entry
      currentUsage = await createUserUsage(userId);
      if (!currentUsage) {
        throw new Error('Failed to create new user usage entry');
      }
    }

    // Always update the usage, ensuring no null values
    const updatedUsage = {
      generator: currentUsage.generator ?? 0,
      upscaler: currentUsage.upscaler ?? 0,
      enhance_prompt: currentUsage.enhance_prompt ?? 0,
    };

    const result = await updateUserUsage(userId, updatedUsage);
    
    console.log('Usage sync result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({ success: true, updatedUsage: result });
  } catch (error) {
    console.error('Error syncing usage data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
