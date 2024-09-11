"use server";

import replicate from "@/lib/replicate";
import { FluxImageParams, FluxImageResult } from "@/types/imageTypes";

// Function to generate an image using the Flux model from Replicate
export async function generateFluxImage(params: FluxImageParams): Promise<FluxImageResult> {
  const input: any = {
    prompt: params.prompt,
    num_outputs: params.num_outputs,
    aspect_ratio: params.aspect_ratio,
    output_format: params.output_format,
    output_quality: params.output_quality,
    disable_safety_checker: params.disable_safety_checker,
    enhance_prompt: params.enhance_prompt,
  };

  // Only add seed to input if it's provided and not null
  if (typeof params.seed === 'number') {
    input.seed = params.seed;
  }

  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in the environment variables.");
    }

    console.log("Attempting to run Replicate model: black-forest-labs/flux-schnell");
    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    
    if (Array.isArray(output) && output.length > 0) {
      // Extract the seed from the logs if available
      let seed = Math.floor(Math.random() * 1000000); // Default to a random seed
      if (typeof output[output.length - 1] === 'string' && output[output.length - 1].includes('Using seed:')) {
        const seedMatch = output[output.length - 1].match(/Using seed: (\d+)/);
        if (seedMatch) {
          seed = parseInt(seedMatch[1]);
        }
      }

      return {
        imageUrls: output.filter(item => typeof item === 'string' && item.startsWith('http')),
        seed: seed
      };
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