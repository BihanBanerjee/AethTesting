// src/lib/response-processing/index.ts
// Consolidated response processing utilities
// Maintains backward compatibility while providing unified access to all response processing functions

// Core response processing functions (from hooks/utils/response-processors.ts)
export { extractResponseContent, extractResponseMetadata } from './response-processors';

// Unified response adapter (from lib/code-generation/unified-response-adapter.ts)  
export { UnifiedResponseAdapter } from './unified-response-adapter';

// Section data processing for UI (from lib/section-data-processor.ts)
export { processResponseData, validateSectionData, createMockSectionData } from './section-data-processor';

// File processing utilities (from dashboard/code-references/utils/file-processor.ts)
export { processFileReferences, groupFilesByType } from './file-processor';

// Shared utilities - new consolidated functions
export {
  getLanguageFromFilename,
  safelyProcessResponse,
  validateResponseStructure,
  sanitizeContent,
  isMalformedContent,
  determineContentType,
  filterUserFacingWarnings,
  extractInsights,
  validateSectionDataStructure,
  processDiffData
} from './shared-utilities';

// Re-export types for convenience
export type { QueryIntent } from '@/lib/intent-classifier';
export type { MessageMetadata, CodeSuggestion } from '@/components/code-assistant/types';
export type { StreamableValue } from 'ai/rsc';
export type { UnifiedResponse, FileReference, Suggestion } from '@/lib/code-generation/response-types';
export type { 
  EnhancedResponse, 
  SectionData, 
  CodeData, 
  FileData, 
  DiffData 
} from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';