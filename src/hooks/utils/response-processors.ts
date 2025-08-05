// src/hooks/utils/response-processors.ts
// Backward compatibility re-exports to maintain existing imports
// All functionality moved to @/lib/response-processing for better organization

export { 
  extractResponseContent, 
  extractResponseMetadata 
} from '@/lib/response-processing/response-processors';

// Re-export types for convenience
export type { QueryIntent } from '@/lib/intent-classifier';
export type { MessageMetadata, CodeSuggestion } from '@/components/code-assistant/types';
export type { StreamableValue } from 'ai/rsc';