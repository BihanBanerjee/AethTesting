// src/app/(protected)/dashboard/actions/config/search-config.ts
import type { IntentType } from '../types/action-types';

export const SEARCH_CONFIG = {
  DEFAULT_SIMILARITY_THRESHOLD: 0.5,
  DEFAULT_RESULT_LIMIT: 10,
  INTENT_SPECIFIC: {
    question: {
      similarityThreshold: 0.3,
      resultLimit: 10,
    },
    explain: {
      similarityThreshold: 0.3,
      resultLimit: 10,
    },
    code_review: {
      similarityThreshold: 0.5,
      resultLimit: 15,
    },
    debug: {
      similarityThreshold: 0.3,
      resultLimit: 5,
    },
    code_generation: {
      similarityThreshold: 0.5,
      resultLimit: 10,
    },
    code_improvement: {
      similarityThreshold: 0.4,
      resultLimit: 8,
    },
    refactor: {
      similarityThreshold: 0.4,
      resultLimit: 12,
    },
  } as Record<IntentType, { similarityThreshold: number; resultLimit: number }>,
} as const;

export function getSearchConfig(intent?: string) {
  if (!intent || !(intent in SEARCH_CONFIG.INTENT_SPECIFIC)) {
    return {
      similarityThreshold: SEARCH_CONFIG.DEFAULT_SIMILARITY_THRESHOLD,
      resultLimit: SEARCH_CONFIG.DEFAULT_RESULT_LIMIT,
    };
  }
  
  return SEARCH_CONFIG.INTENT_SPECIFIC[intent as IntentType];
}