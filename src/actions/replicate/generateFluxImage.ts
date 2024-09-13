"use server";

import replicate from "@/lib/replicate";
import { FluxImageParams, FluxImageResult } from "@/types/imageTypes";

export async function generateFluxImage(params: FluxImageParams): Promise<FluxImageResult[]> {
  console.log("Received params for image generation:", params);

  const baseInput: any = {
    prompt: params.prompt,
    aspect_ratio: params.aspect_ratio,
    output_format: params.output_format,
    output_quality: params.output_quality,
    disable_safety_checker: params.disable_safety_checker,
    enhance_prompt: params.enhance_prompt,
  };

  try {
    let results: FluxImageResult[] = [];

    if (params.seed !== undefined) {
      // For follow-up levels 2+, use a single API call with the same seed
      baseInput.seed = params.seed;
      baseInput.num_outputs = params.num_outputs;
      console.log("Generating multiple images with seed:", baseInput.seed);
      const result = await runReplicateModel(baseInput);
      results = result.imageUrls.map((url, index) => ({
        imageUrls: [url],
        seed: result.seed,
        prompt: params.prompt,
        followUpLevel: params.followUpLevel,
        index: index
      }));
    } else {
      // For initial generation and follow-up level 1, make separate API calls
      baseInput.num_outputs = 1;
      for (let i = 0; i < params.num_outputs; i++) {
        console.log(`Generating image ${i + 1} of ${params.num_outputs}`);
        const result = await runReplicateModel(baseInput);
        results.push({
          imageUrls: result.imageUrls,
          seed: result.seed,
          prompt: params.prompt,
          followUpLevel: params.followUpLevel,
          index: i
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error in generateFluxImage:", error);
    throw new Error(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function runReplicateModel(input: any): Promise<{imageUrls: string[], seed: number}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in the environment variables.");
    }
    console.log("Running Replicate model: black-forest-labs/flux-schnell with input:", input);
    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-schnell",
      input: input,
    });

    console.log("Prediction created:", prediction.id);

    let completedPrediction;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    do {
      completedPrediction = await replicate.predictions.get(prediction.id);
      console.log("Prediction status:", completedPrediction.status);
      if (completedPrediction.status === "succeeded" || completedPrediction.status === "failed") break;
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    } while (attempts < maxAttempts);

    if (completedPrediction.status === "failed") {
      throw new Error(`Image generation failed: ${completedPrediction.error || 'Unknown error'}`);
    }

    if (attempts >= maxAttempts) {
      throw new Error("Image generation timed out after 30 seconds");
    }

    console.log("Full Replicate API response:", JSON.stringify(completedPrediction, null, 2));

    const output = completedPrediction.output;
    console.log("Raw Replicate output:", output);

    if (Array.isArray(output) && output.length > 0) {
      let seed = input.seed;

      if (completedPrediction.logs) {
        const seedMatch = completedPrediction.logs.match(/Using seed: (\d+)/);
        if (seedMatch) {
          seed = parseInt(seedMatch[1]);
          console.log("Extracted seed from logs:", seed);
        } else {
          console.log("Could not extract seed from logs");
        }
      }

      const result: {imageUrls: string[], seed: number} = {
        imageUrls: output.filter(item => typeof item === 'string' && item.startsWith('http')),
        seed: seed || Math.floor(Math.random() * 1000000)
      };

      console.log("Final result:", result);
      return result;
    } else {
      throw new Error('Unexpected response format from Replicate API');
    }
  } catch (error) {
    console.error('Error in runReplicateModel:', error);
    throw new Error(`Failed to run Replicate model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}