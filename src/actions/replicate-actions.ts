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
  const customStopSequence = "<<END_OF_ENHANCED_PROMPT>>";
  const input = {
    top_k: 0,
    top_p: 0.95,
    prompt: prompt,
    max_tokens: 300,  // Increased slightly to accommodate the stop sequence
    temperature: 0.7,
    system_prompt: `You are an AI expert in creating vivid, detailed image generation prompts. Enhance the given prompt by adding rich details, artistic styles, specific elements, lighting, atmosphere, mood, composition, and perspective. 

CRITICAL INSTRUCTIONS:
1. Output ONLY the enhanced prompt.
2. Do not include any explanations, notes, or additional text.
3. Do not include token counts or code snippets.
4. The enhanced prompt MUST be between 150-250 tokens.
5. Focus on impactful, concise enhancements.
6. Avoid repetition or irrelevant details.
7. Maintain the core essence of the original prompt.
8. Use varied and vivid vocabulary.
9. After completing the enhanced prompt, immediately add the following stop sequence on a new line: ${customStopSequence}`,
    length_penalty: 1,
    max_new_tokens: 300,  // Increased slightly to accommodate the stop sequence
    stop_sequences: customStopSequence,
    prompt_template: "system\n\n{system_prompt}\n\nEnhance this prompt: {prompt}\n\n",
    presence_penalty: 0,
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

    // Remove the custom stop sequence if it's present
    enhancedPrompt = enhancedPrompt.replace(new RegExp(`\\s*${customStopSequence}.*$`, 's'), '').trim();

    // Ensure the output is within the desired token range
    const tokens = enhancedPrompt.split(/\s+/);
    if (tokens.length < 150) {
      console.warn('Generated prompt is too short, using original prompt');
      return prompt; // Return the original prompt if the enhanced one is too short
    } else if (tokens.length > 250) {
      enhancedPrompt = tokens.slice(0, 250).join(' ');
    }

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    // If there's an error, return the original prompt
    return prompt;
  }
}