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
    output_format: params.output_format, // Remove the conversion, use the format as-is
    output_quality: params.output_quality,
    disable_safety_checker: params.disable_safety_checker,
    enhance_prompt: params.enhance_prompt, // Include enhance_prompt in the API call
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
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while generating the image');
    }
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

export async function enhancePrompt(prompt: string) {
  const input = {
    top_k: 0,
    top_p: 0.95,
    prompt: `Enhance the following image generation prompt for. Provide ONLY the enhanced prompt, without any explanations or additional text:\n\n"${prompt}"`,
    max_tokens: 300,
    temperature: 0.7,
    system_prompt: `You are an expert AI Image Prompt Engineer. Your task is to enhance image generation prompts by adding vivid details, artistic styles, and specific elements. Focus on creating rich, evocative descriptions that will result in stunning, high-quality generated images. Maintain the original intent while significantly improving the prompt's potential for creating captivating visuals. Provide ONLY the enhanced prompt, without any explanations or additional text. Keep the enhanced prompt concise and within 300 tokens or less.`,
    length_penalty: 1,
    max_new_tokens: 300,
    prompt_template: "{system_prompt}\n\n{prompt}\n\n",
    presence_penalty: 0,
    log_performance_metrics: false
  };

  try {
    const output = await replicate.run("meta/meta-llama-3-8b-instruct", { input }) as string | string[];
    if (typeof output === 'string') {
      // Remove any potential prefixes like "Here's an enhanced version of the prompt:" or "Enhanced prompt:"
      return output.replace(/^(Here's an enhanced version of the prompt:|Enhanced prompt:)\s*/i, '').trim();
    } else if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
      // If the output is an array of strings, join them and clean as above
      return output.join(' ').replace(/^(Here's an enhanced version of the prompt:|Enhanced prompt:)\s*/i, '').trim();
    } else {
      throw new Error('Unexpected response format from Replicate API');
    }
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to enhance prompt: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while enhancing the prompt');
    }
  }
}