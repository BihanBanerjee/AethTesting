// src/lib/code-generation/unified-response-adapter.ts
// Backward compatibility re-export to maintain existing imports
// All functionality moved to @/lib/response-processing for better organization

export { UnifiedResponseAdapter } from '@/lib/response-processing/unified-response-adapter';

// Re-export types for convenience
export type { CodeGenerationResult } from "./types";
export type { UnifiedResponse, FileReference, Suggestion } from "./response-types";