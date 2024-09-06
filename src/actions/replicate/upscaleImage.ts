"use server";

import replicate from "@/lib/replicate";
import { kv } from "@vercel/kv";

export async function upscaleImage(image: string, scale: number, faceEnhance: boolean): Promise<string> {
  const jobId = `upscale_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Store the job in KV store
  await kv.set(jobId, { status: 'pending', params: { image, scale, faceEnhance } });

  // Trigger the actual upscaling process in the background
  upscaleImageBackground(jobId, image, scale, faceEnhance);

  return jobId;
}

async function upscaleImageBackground(jobId: string, image: string, scale: number, faceEnhance: boolean) {
  try {
    const output = await replicate.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
      {
        input: {
          image,
          scale,
          face_enhance: faceEnhance,
        },
      }
    );

    if (typeof output === 'string') {
      await kv.set(jobId, { status: 'completed', result: output });
    } else {
      throw new Error('Unexpected response from Replicate API');
    }
  } catch (error) {
    console.error('Error in upscaleImageBackground:', error);
    await kv.set(jobId, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function getUpscaleStatus(jobId: string): Promise<{ status: string, result?: string, error?: string }> {
  const job = await kv.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  return job as { status: string, result?: string, error?: string };
}