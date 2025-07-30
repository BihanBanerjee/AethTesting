// src/lib/code-generation/model-config.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

/**
 * Centralized Gemini model configuration optimized for code generation
 * 
 * Gemini 1.5 Pro Context Window: ~1M tokens (~750K characters)
 * This allows us to process very large files without truncation
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: {
    maxOutputTokens: 32768, // Significantly increased for complete README generation (was 8192)
    temperature: 0.1, // Lower temperature for more consistent, deterministic code
    topP: 0.8, // Nucleus sampling for quality
    topK: 40, // Limited choices for focused responses
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

/**
 * Context window limits for different use cases
 */
export const CONTEXT_LIMITS = {
  // Characters (approximate)
  SMALL_FILE: 5000,
  MEDIUM_FILE: 25000, 
  LARGE_FILE: 50000,
  VERY_LARGE_FILE: 100000,
  
  // Tokens (approximate - 1 token ≈ 0.75 characters for code)
  MAX_INPUT_TOKENS: 750000, // ~563K characters
  MAX_OUTPUT_TOKENS: 32768, // ~24K characters (increased from 8192)
} as const;