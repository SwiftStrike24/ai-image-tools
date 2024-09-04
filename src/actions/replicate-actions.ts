"use server";

import replicate from "@/lib/replicate";

interface FluxImageParams {
  prompt: string;
  aspect_ratio: string;
  num_outputs: number;
  output_format: string;
  output_quality: number;
  enhance_prompt: boolean;
  disable_safety_checker: boolean;
}

export async function generateFluxImage(params: FluxImageParams) {
  const input = {
    prompt: params.prompt,
    num_outputs: params.num_outputs,
    aspect_ratio: params.aspect_ratio,
    output_format: params.output_format,
    output_quality: params.output_quality,
    disable_safety_checker: params.disable_safety_checker,
    // We'll ignore enhance_prompt for now as requested
  };

  try {
    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    
    if (Array.isArray(output) && output.length > 0) {
      return output; // Return all image URLs
    } else {
      throw new Error('Unexpected response format from Replicate API');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error; // Re-throw the error to be handled by the component
  }
}

export async function upscaleImage(imageData: string, upscaleFactor: number, faceEnhance: boolean) {
  const input = {
    image: imageData,
    scale: upscaleFactor,
    face_enhance: faceEnhance
  };

  const output = await replicate.run("nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa", { input });
  return output;
}