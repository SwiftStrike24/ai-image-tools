"use server";

import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";

// Model configuration
const UPSCALE_MODEL = {
  name: "nightmareai/real-esrgan",
  version: "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
};

// Replicate client initialization
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Types
type ReplicateOutput = string | string[] | { image: string } | null;
type UpscaleParams = {
  image: string;
  scale: number;
  faceEnhance: boolean;
};

// Helper functions
const isValidImageUrl = (url: string): boolean => 
  typeof url === 'string' && url.startsWith('http');

const extractImageUrl = (result: ReplicateOutput): string => {
  if (isValidImageUrl(result as string)) {
    return result as string;
  } else if (Array.isArray(result) && result.length > 0 && isValidImageUrl(result[0])) {
    return result[0];
  } else if (result && typeof result === 'object' && 'image' in result && isValidImageUrl(result.image)) {
    return result.image;
  }
  throw new Error('Replicate API did not return a valid image URL');
};

const pollForResult = async (predictionId: string): Promise<ReplicateOutput> => {
  const maxAttempts = 30; // 1 minute max waiting time
  const pollingInterval = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await replicate.predictions.get(predictionId);
    if (status.status === "succeeded") {
      return status.output;
    } else if (status.status === "failed") {
      throw new Error("Upscaling failed");
    }
    await new Promise(resolve => setTimeout(resolve, pollingInterval));
  }
  throw new Error("Upscaling timed out");
};

// Main function
export async function upscaleImage({ image, scale, faceEnhance }: UpscaleParams): Promise<string> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  console.log(`Upscale request received for ${UPSCALE_MODEL.name}:`, { scale, faceEnhance });

  try {
    const prediction = await replicate.predictions.create({
      version: UPSCALE_MODEL.version,
      input: { image, scale, face_enhance: faceEnhance },
    });

    console.log("Prediction created:", prediction.id);

    const result = await pollForResult(prediction.id);
    console.log("Replicate API response received");

    const imageUrl = extractImageUrl(result);
    console.log("Upscaled image URL:", imageUrl);

    return imageUrl;
  } catch (error) {
    console.error("Error in upscaleImage:", error);
    throw new Error(`Failed to upscale image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}