"use server";

import replicate from "@/lib/replicate";

export async function upscaleImage(image: string, scale: number, faceEnhance: boolean): Promise<string> {
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
      return output;
    } else {
      throw new Error('Unexpected response from Replicate API');
    }
  } catch (error) {
    console.error('Error in upscaleImage:', error);
    throw error;
  }
}