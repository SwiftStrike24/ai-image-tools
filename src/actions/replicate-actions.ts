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
    console.log("Attempting to run Replicate model...");
    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    
    if (Array.isArray(output) && output.length > 0) {
      return output; // Return all image URLs
    } else {
      throw new Error('Unexpected response format from Replicate API');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      throw new Error(`Failed to generate image: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred while generating the image');
    }
  }
}

export async function upscaleImage(image: string, scale: number, faceEnhance: boolean): Promise<string> {
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

    if (typeof output === 'string') {
      return output;
    } else {
      throw new Error('Unexpected response from Replicate API');
    }
  } catch (error) {
    console.error('Error in upscaleImage:', error);
    throw error;
  }
}

export async function enhancePrompt(prompt: string) {
  const customStopSequence = "<<END_OF_ENHANCED_PROMPT>>";
  const input = {
    top_k: 0,
    top_p: 0.95,
    prompt: prompt,
    max_tokens: 300,
    temperature: 0.7,
    system_prompt: `You are an AI expert in creating vivid, detailed image generation prompts. Your task is to enhance the given prompt by adding rich details, artistic styles, specific elements, lighting, atmosphere, mood, composition, and perspective. 

CRITICAL INSTRUCTIONS:
1. Begin your response with "<<START_OF_ENHANCED_PROMPT>>" on a new line.
2. Then, on the next line, provide ONLY the enhanced prompt.
3. After the enhanced prompt, on a new line, add "${customStopSequence}".
4. Do not include any explanations, notes, or additional text.
5. Do not include token counts or code snippets.
6. The enhanced prompt itself (excluding start and end markers) MUST be between 150-250 tokens.
7. Focus on impactful, concise enhancements.
8. Avoid repetition or irrelevant details.
9. Maintain the core essence of the original prompt.
10. Use varied and vivid vocabulary.`,
    length_penalty: 1,
    max_new_tokens: 300,
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

    // Extract the content between START and END markers
    const startMarker = "<<START_OF_ENHANCED_PROMPT>>";
    const endMarker = customStopSequence;
    const startIndex = enhancedPrompt.indexOf(startMarker);
    const endIndex = enhancedPrompt.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      enhancedPrompt = enhancedPrompt.slice(startIndex + startMarker.length, endIndex).trim();
    } else {
      console.warn('Markers not found in the expected format, using the whole output');
    }

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