"use server";

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function upscaleImage(image: string, scale: number, faceEnhance: boolean): Promise<string> {
  console.log("Upscale request received:", { scale, faceEnhance });

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

    console.log("Replicate API response:", output);

    if (typeof output === 'string') {
      return output;
    } else {
      throw new Error('Unexpected response from Replicate API');
    }
  } catch (error) {
    console.error("Error in upscaleImage:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upscale image: ${error.message}`);
    } else {
      throw new Error("Failed to upscale image: Unknown error");
    }
  }
}