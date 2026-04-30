import { ai } from "@/ai/genkit";

// Tiered model list based on user context
const GEMINI_MODELS = [
  "googleai/gemini-2.0-flash",
  "googleai/gemini-2.5-flash", 
  "googleai/gemini-3.1-flash-lite-preview",
  "googleai/gemini-3.1-flash-preview",
  "googleai/gemini-1.5-flash",
  "googleai/gemini-1.5-flash-8b",
  "googleai/gemini-3.1-pro-preview",
  "googleai/gemini-2.5-pro",
  "googleai/gemini-1.5-pro",
];

let currentBestModel = GEMINI_MODELS[0];

/**
 * Executes a Genkit generation with automatic Gemini model cycling.
 * Falls back to other Gemini variants if the primary model hits rate limits.
 */
export async function generateWithGeminiCycle(options: any) {
  const modelsToTry = [currentBestModel, ...GEMINI_MODELS.filter(m => m !== currentBestModel)];
  
  for (const modelId of modelsToTry) {
    try {
      console.log(`[GeminiCycle] Attempting with: ${modelId}`);
      const result = await ai.generate({
        ...options,
        model: modelId,
      });
      
      // If it worked and it wasn't our "Best", promote it
      if (modelId !== currentBestModel) {
        console.log(`[GeminiCycle] New stable model found: ${modelId}`);
        currentBestModel = modelId;
      }
      
      return result;
    } catch (error: any) {
      const isRateLimit = error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('429') || error.message?.includes('quota');
      
      if (isRateLimit) {
        console.warn(`[GeminiCycle] ${modelId} exhausted. Trying next fallback...`);
        continue;
      }
      
      // If it's a different error, re-throw it
      throw error;
    }
  }
  
  throw new Error("All Gemini models exhausted. Cycle failed.");
}
