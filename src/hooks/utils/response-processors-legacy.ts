// src/hooks/utils/response-processors-legacy.ts
// Backward compatibility re-exports
// This ensures existing imports continue to work without breaking changes

export { 
  extractResponseContent, 
  extractResponseMetadata 
} from '@/lib/response-processing/response-processors';