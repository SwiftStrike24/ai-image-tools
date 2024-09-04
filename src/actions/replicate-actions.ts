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
    enhance_prompt: params.enhance_prompt,
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
    top_k: 0,  // Keep it deterministic with most probable completions
    top_p: 0.9,  // Focus on top 90% of likely outcomes, improving coherence
    prompt: prompt,
    max_tokens: 200,  // Reduced token limit to minimize cost and focus on brevity
    temperature: 0.5,  // Lowered to control creativity and ensure precision
    system_prompt: `
      You are an AI assistant specialized in enhancing image generation prompts. 
      Your task is to improve the given prompt by adding vivid details, artistic styles, and specific elements. 
      CRITICAL: Output ONLY the enhanced prompt, with no additional explanation, formatting, or text. 
      The response MUST be between 100-200 tokens.
      Focus on concise, impactful enhancements, avoiding repetition or irrelevant details.`,
    length_penalty: 1.2,  // Encourages concise output, penalizing overly long responses
    max_new_tokens: 200,  // Matches max_tokens to control total output size
    stop_sequences: "respond",  // Changed from array to string
    prompt_template: `
      system\n\n{system_prompt}\n\nEnhance this image prompt: {prompt}\n\nEnhanced prompt:`,
    presence_penalty: 0.6,  // Reduces repetition to promote creativity and uniqueness in details
    frequency_penalty: 0.5,  // Added to ensure varied vocabulary and prevent redundancy
    log_performance_metrics: false  // Disable logging to reduce unnecessary overhead
  };

  try {
    const output = await replicate.run("meta/meta-llama-3-8b-instruct", { input }) as string | string[];
    let enhancedPrompt = '';
    if (typeof output === 'string') {
      enhancedPrompt = output.trim();
    } else if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
      enhancedPrompt = output.join(' ').trim();
    } else {
      throw new Error('Unexpected response format from Replicate API');
    }

    // Truncate the output if it exceeds 250 tokens
    const tokens = enhancedPrompt.split(/\s+/);
    if (tokens.length > 250) {
      enhancedPrompt = tokens.slice(0, 250).join(' ');
    }

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to enhance prompt: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while enhancing the prompt');
    }
  }
}