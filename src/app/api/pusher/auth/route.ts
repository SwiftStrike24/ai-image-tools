import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const socket_id = formData.get('socket_id') as string;
  const channel_name = formData.get('channel_name') as string;

  if (!socket_id || !channel_name) {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }

  const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
    user_id: userId,
    user_info: {},
  });

  return NextResponse.json(authResponse);
}
