"use server";

import replicate from "@/lib/replicate";
import { FluxImageParams } from "@/types/imageTypes";

// Function to generate an image using the Flux model from Replicate
export async function generateFluxImage(params: FluxImageParams): Promise<string[]> {
  const input = {
    prompt: params.prompt,
    num_outputs: params.num_outputs,
    aspect_ratio: params.aspect_ratio,
    output_format: params.output_format,
    output_quality: params.output_quality,
    disable_safety_checker: params.disable_safety_checker,
    enhance_prompt: params.enhance_prompt,
  };

  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in the environment variables.");
    }

    console.log("Attempting to run Replicate model...");
    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    
    if (Array.isArray(output) && output.length > 0) {
      return output;
    } else {
      throw new Error('Unexpected response format from Replicate API');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while generating the image');
    }
  }
}