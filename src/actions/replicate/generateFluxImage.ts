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
    console.log("Input seed:", input.seed);
  } else {
    console.log("No input seed provided");
  }

  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in the environment variables.");
    }

    console.log("Running Replicate model: black-forest-labs/flux-schnell");
    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    
    console.log("Raw Replicate output:", output);

    if (Array.isArray(output) && output.length > 0) {
      const lastItem = output[output.length - 1];
      let seed = params.seed;

      if (typeof lastItem === 'string') {
        const seedMatch = lastItem.match(/Using seed: (\d+)/);
        if (seedMatch) {
          seed = parseInt(seedMatch[1]);
          console.log("Extracted seed from logs:", seed);
        } else {
          console.log("Could not extract seed from logs");
        }
      }

      const result: FluxImageResult = {
        imageUrls: output.filter(item => typeof item === 'string' && item.startsWith('http')),
        seed: seed || Math.floor(Math.random() * 1000000)
      };

      console.log("Final result:", result);
      return result;
    } else {
      throw new Error('Unexpected response format from Replicate API');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}