// src/app/(protected)/dashboard/actions/config/ai-config.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const AI_MODELS = {
  FAST: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro',
} as const;

export const MODEL_CONFIG = {
  QUESTION_ANSWERING: AI_MODELS.FAST,
  CODE_GENERATION: AI_MODELS.PRO,
  CODE_IMPROVEMENT: AI_MODELS.PRO,
  DEBUG_ASSISTANCE: AI_MODELS.PRO,
} as const;