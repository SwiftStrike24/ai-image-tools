"use server";

import replicate from "@/lib/replicate";
import { enhancePromptGPT4oMini } from "@/actions/openai/enhancePrompt-gpt-4o-mini";

// Define the return type to include the used model
interface EnhancePromptResult {
  enhancedPrompt: string;
  usedModel: 'meta-llama-3-8b-instruct' | 'gpt-4o-mini';
}

// Updated prompt_template with explicit markers
const promptTemplate = `system

{system_prompt}

<<START_OF_ENHANCED_PROMPT>>
Enhance this prompt: {prompt}
<<END_OF_ENHANCED_PROMPT>>`;

// Function to enhance a prompt using Replicate
export async function enhancePrompt(prompt: string): Promise<EnhancePromptResult> {
  const customStopSequence = "<<END_OF_ENHANCED_PROMPT>>";
  const input = {
    top_k: 0,
    top_p: 0.95,
    prompt: prompt,
    max_tokens: 300,
    temperature: 0.7,
    system_prompt: `You are an AI expert in creating vivid, detailed image generation prompts. Your task is to enhance the given prompt by adding rich details, artistic styles, specific elements, lighting, atmosphere, mood, composition, and perspective. 

CRITICAL INSTRUCTIONS:
1. Provide ONLY the enhanced prompt.
2. Do not include any explanations, notes, or additional text.
3. The enhanced prompt itself MUST be between 150-250 tokens.
4. Focus on impactful, concise enhancements.
5. Avoid repetition or irrelevant details.
6. Maintain the core essence of the original prompt.
7. Use varied and vivid vocabulary.`,
    length_penalty: 1,
    max_new_tokens: 300,
    stop_sequences: customStopSequence,
    prompt_template: promptTemplate, // Use the updated prompt template
    presence_penalty: 0,
    log_performance_metrics: false
  };

  try {
    let enhancedPrompt = '';
    let usedModel: EnhancePromptResult['usedModel'] = 'meta-llama-3-8b-instruct';

    try {
      const output = await Promise.race([
        replicate.run("meta/meta-llama-3-8b-instruct", { input }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Enhance prompt request timed out")), 20000))
      ]) as string | string[];

      // Ensure output is a single string
      const outputString = typeof output === 'string' ? output : output.join('');

      // Use RegExp to extract content between markers, allowing for potential spaces
      const markerRegex = /<<\s*START_OF_ENHANCED_PROMPT\s*>>([\s\S]*?)<<\s*END_OF_ENHANCED_PROMPT\s*>>/;
      const match = outputString.match(markerRegex);

      if (match && match[1]) {
        enhancedPrompt = match[1].trim();
      } else {
        console.warn('Markers not found or improperly formatted, using entire output.');
        enhancedPrompt = outputString.replace(/<<\s*START_OF_ENHANCED_PROMPT\s*>>|<<\s*END_OF_ENHANCED_PROMPT\s*>>/g, '').trim();
      }
    } catch (error) {
      console.warn('Meta-Llama 3 API failed, falling back to GPT-4o-mini:', error);
      enhancedPrompt = await enhancePromptGPT4oMini(prompt);
      usedModel = 'gpt-4o-mini';
    }

    // Remove any markdown or annotations
    enhancedPrompt = enhancedPrompt.replace(/\*\*[^*]+\*\*/, '').trim();

    // Ensure the output is within the desired token range
    const tokens = enhancedPrompt.split(/\s+/);
    if (tokens.length < 10) { // Lowered from 150
      console.warn('Generated prompt is too short, using original prompt');
      return { enhancedPrompt: prompt, usedModel };
    } else if (tokens.length > 250) {
      enhancedPrompt = tokens.slice(0, 250).join(' ');
    }

    return { enhancedPrompt, usedModel };
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return { enhancedPrompt: prompt, usedModel: 'gpt-4o-mini' }; // Assume fallback was used
  }
}