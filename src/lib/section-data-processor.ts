// src/lib/section-data-processor.ts
// Backward compatibility re-exports to maintain existing imports
// All functionality moved to @/lib/response-processing for better organization

export { 
  processResponseData, 
  validateSectionData, 
  createMockSectionData 
} from '@/lib/response-processing/section-data-processor';

// Re-export types for convenience
export type { 
  EnhancedResponse, 
  SectionData, 
  CodeData, 
  FileData, 
  DiffData,
  FileReference
} from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';