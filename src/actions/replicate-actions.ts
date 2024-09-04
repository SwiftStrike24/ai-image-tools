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
    top_k: 50,  // Increased to allow for more diverse word choices
    top_p: 0.95,  // Slightly increased to allow for more creative outputs
    prompt: prompt,
    max_tokens: 512,  // Increased to allow for more detailed descriptions
    temperature: 0.7,  // Increased to encourage more creative outputs
    system_prompt: `
      You are an AI expert in creating vivid, detailed image generation prompts.
      Your task is to enhance the given prompt by:
      1. Adding rich, sensory details (visual, auditory, olfactory, tactile)
      2. Incorporating artistic styles or techniques
      3. Suggesting specific elements to include
      4. Describing lighting, atmosphere, and mood
      5. Mentioning composition or perspective

      CRITICAL INSTRUCTIONS:
      - Output ONLY the enhanced prompt, with no additional explanation or text
      - The response MUST be between 150-250 tokens
      - Focus on impactful, concise enhancements
      - Avoid repetition or irrelevant details
      - Maintain the core essence and theme of the original prompt
      - Use varied and vivid vocabulary to create a compelling scene`,
    length_penalty: 1.0,  // Adjusted to be more neutral
    max_new_tokens: 512,  // Matches max_tokens
    stop_sequences: "END",  // Clear stop sequence to prevent early cutoff
    prompt_template: `
      {system_prompt}

      Original prompt: {prompt}

      Enhanced prompt:`,
    presence_penalty: 0.3,  // Reduced to allow for some repetition of important elements
    frequency_penalty: 0.7,  // Increased to encourage more diverse vocabulary
    log_performance_metrics: false
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

    // Remove any potential "Enhanced prompt:" prefix
    enhancedPrompt = enhancedPrompt.replace(/^Enhanced prompt:\s*/i, '');

    // Ensure the output is within the desired token range
    const tokens = enhancedPrompt.split(/\s+/);
    if (tokens.length < 150) {
      throw new Error('Generated prompt is too short');
    } else if (tokens.length > 250) {
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