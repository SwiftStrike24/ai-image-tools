import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserUsage } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usage = await req.json();
    await updateUserUsage(userId, usage);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing usage data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
