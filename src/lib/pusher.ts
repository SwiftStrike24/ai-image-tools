import Pusher from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    });
  }
  return pusherClient;
}

export function disconnectPusherClient() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}

// Centralize Pusher event triggering with debounce
const eventQueue: { channelName: string; eventName: string; data: any }[] = [];
let isProcessingQueue = false;

export async function triggerPusherEvent(channelName: string, eventName: string, data: any) {
  eventQueue.push({ channelName, eventName, data });
  if (!isProcessingQueue) {
    isProcessingQueue = true;
    setTimeout(processEventQueue, 100); // Debounce for 100ms
  }
}

async function processEventQueue() {
  const events = [...eventQueue];
  eventQueue.length = 0;
  
  try {
    await pusherServer.triggerBatch(events.map(event => ({
      channel: event.channelName,
      name: event.eventName,
      data: event.data,
    })));
  } catch (error) {
    console.error('Error triggering Pusher events:', error);
  }
  
  isProcessingQueue = false;
  if (eventQueue.length > 0) {
    setTimeout(processEventQueue, 100);
  }
}
