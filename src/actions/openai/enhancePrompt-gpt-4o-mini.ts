"use server";

import OpenAI from "openai";

// Initialize OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to enhance a prompt using GPT-4o-mini
export async function enhancePromptGPT4oMini(prompt: string): Promise<string> {
  const customStopSequence = "<<END_OF_ENHANCED_PROMPT>>";
  const systemPrompt = `
You are a highly skilled AI specializing in crafting vivid and detailed image generation prompts. Your objective is to enhance the provided prompt by incorporating rich details, artistic styles, specific elements, lighting, atmosphere, mood, composition, and perspective.

CRITICAL INSTRUCTIONS:
1. **Provide ONLY** the enhanced prompt.
2. **Do not include** any explanations, notes, or additional text.
3. The enhanced prompt **MUST** be between 150-250 tokens.
4. Focus on **impactful and concise** enhancements.
5. **Avoid repetition** or irrelevant details.
6. **Maintain** the core essence of the original prompt.
7. Use **varied and vivid** vocabulary.
8. Ensure the enhanced prompt flows naturally and is **coherent**.
9. Preserve the original intent and key elements of the prompt.
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
      return prompt; // Return original prompt if response is invalid
    }

    let enhancedPrompt = response.choices[0].message?.content || "";
    
    // Remove the end marker and clean up the prompt
    enhancedPrompt = enhancedPrompt
      .replace(customStopSequence, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Adjust the token count check
    const tokens = enhancedPrompt.split(/\s+/).length;
    if (tokens < 10) { // Lowered from 150
      console.warn('Generated prompt is too short, using original prompt');
      return prompt; // Return original prompt if enhanced prompt is too short
    } else if (tokens > 250) {
      enhancedPrompt = enhancedPrompt.split(/\s+/).slice(0, 250).join(' ');
    }

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with GPT-4o-mini:', error);
    return prompt; // Return original prompt if there's an error
  }
}