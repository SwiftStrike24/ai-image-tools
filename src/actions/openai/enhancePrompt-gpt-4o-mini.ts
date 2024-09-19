"use server";

import OpenAI from "openai";

// Initialize OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to enhance a prompt using GPT-4o-mini
export async function enhancePromptGPT4oMini(prompt: string): Promise<string> {
  const customStopSequence = "<<END_OF_ENHANCED_PROMPT>>";
  const systemPrompt = `
You are an AI expert in creating vivid, detailed image generation prompts. Enhance the given prompt by adding rich details, artistic styles, specific elements, lighting, atmosphere, mood, composition, and perspective.

// Removed <<END_OF_ENHANCED_PROMPT>> marker
CRITICAL INSTRUCTIONS:
1. Provide ONLY the enhanced prompt.
2. Do not include any explanations, notes, or additional text.
3. The enhanced prompt itself (excluding end marker) MUST be between 150-250 tokens.
4. Focus on impactful, concise enhancements.
5. Avoid repetition or irrelevant details.
6. Maintain the core essence of the original prompt.
7. Use varied and vivid vocabulary.
`;

  try {
    const response = await Promise.race([
      openai.chat.completions.create({ // Updated method
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Enhance this prompt: ${prompt}` },
        ],
        max_tokens: 300,
        temperature: 0.7,
        stop: [customStopSequence],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Enhance prompt request timed out")), 30000))
    ]);

    console.log('Full OpenAI Response:', JSON.stringify(response, null, 2));

    if (!response || !response.choices || response.choices.length === 0) {
      console.error('Invalid response structure:', response);
      throw new Error("Invalid response structure from OpenAI API.");
    }

    let enhancedPrompt = response.choices[0].message?.content || "";
    
    // Remove the end marker and clean up the prompt
    enhancedPrompt = enhancedPrompt
      .replace(customStopSequence, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Ensure token count is within range
    const tokens = enhancedPrompt.split(/\s+/).length;
    if (tokens < 150) {
      console.warn('Generated prompt is too short, using original prompt');
      return prompt;
    } else if (tokens > 250) {
      enhancedPrompt = enhancedPrompt.split(/\s+/).slice(0, 250).join(' ');
    }

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with GPT-4o-mini:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to enhance prompt: ${error.message}`);
    } else {
      throw new Error("Failed to enhance prompt: Unknown error");
    }
  }
}