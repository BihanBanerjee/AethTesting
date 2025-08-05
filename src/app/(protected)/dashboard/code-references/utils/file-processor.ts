// src/app/(protected)/dashboard/code-references/utils/file-processor.ts
// Backward compatibility re-export to maintain existing imports
// All functionality moved to @/lib/response-processing for better organization

export { 
  processFileReferences, 
  groupFilesByType 
} from '@/lib/response-processing/file-processor';

// Re-export types for convenience
export type { EnhancedFileReference } from '@/lib/response-processing/types/file-reference';