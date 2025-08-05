// src/lib/response-processing/shared-utilities.ts
// Consolidated shared utilities taking the best from all response processing files

/**
 * Enhanced language detection from filename extension
 * Combines the most comprehensive mapping from response-processors.ts (24 languages)
 * with additional languages from section-data-processor.ts
 */
export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    // Core web languages
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // Backend languages
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    
    // Shell and config
    'sh': 'bash',
    'bash': 'bash',
    'env': 'bash',
    'dockerfile': 'dockerfile',
    
    // Data formats
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sql': 'sql',
    
    // Documentation
    'md': 'markdown',
    'markdown': 'markdown'
  };

  return languageMap[ext || ''] || 'text';
};

/**
 * Safe error handling wrapper from response-processors.ts
 * Provides consistent error recovery across all processing functions
 */
export function safelyProcessResponse<T>(
  processor: () => T,
  fallback: T,
  context: string = 'response processing'
): T {
  try {
    return processor();
  } catch (error) {
    console.error(`Error during ${context}:`, error);
    return fallback;
  }
}

/**
 * Enhanced response validation combining patterns from all files
 * Validates response structure to ensure proper processing
 */
export function validateResponseStructure(response: unknown): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  const res = response as any;
  
  // Check for any form of meaningful content
  return !!(
    res.answer || 
    res.explanation || 
    res.response || 
    res.summary || 
    res.diagnosis || 
    res.generatedCode ||
    res.improvedCode ||
    res.refactoredCode ||
    res.codeExplanation ||
    res.content ||
    (res.files && Array.isArray(res.files) && res.files.length > 0) ||
    (res.filesReferences && Array.isArray(res.filesReferences) && res.filesReferences.length > 0)
  );
}

/**
 * Content sanitization and unescaping from response-processors.ts
 * Handles malformed JSON strings and escaped characters
 */
export function sanitizeContent(content: string): string {
  if (typeof content !== 'string') return '';
  
  // Unescape newlines and other escaped characters for proper display
  return content
    .replace(/\\n/g, '\n')      // Convert \n to actual newlines
    .replace(/\\r/g, '\r')      // Convert \r to carriage returns  
    .replace(/\\t/g, '\t')      // Convert \t to tabs
    .replace(/\\"/g, '"')       // Convert \" to quotes
    .replace(/\\\\/g, '\\');    // Convert \\ to single backslash
}

/**
 * Detect malformed response content from response-processors.ts
 * Identifies JSON-like strings that should be treated as explanations instead
 */
export function isMalformedContent(content: string): boolean {
  if (typeof content !== 'string') return false;
  
  return content.includes('"language"') && 
         content.includes('"explanation"') &&
         !content.trim().startsWith('{') &&
         !content.trim().endsWith('}');
}

/**
 * Enhanced content type detection from unified-response-adapter.ts
 * Determines appropriate content type based on result and intent
 */
export function determineContentType(
  result: any, 
  intent: string
): 'text' | 'code' | 'markdown' | 'json' {
  // Code generation and modification intents produce code
  if (['code_generation', 'code_improvement', 'refactor'].includes(intent)) {
    return 'code';
  }

  // Explanation intents typically produce markdown
  if (intent === 'explain') {
    return 'markdown';
  }

  // Review and debug typically produce structured text
  if (['code_review', 'debug'].includes(intent)) {
    return 'text';
  }

  // Default based on file content
  if (result?.files && result.files.length > 0 && result.files[0]?.content) {
    return 'code';
  }

  return 'text';
}

/**
 * Filter warnings for user-facing display from unified-response-adapter.ts
 * Removes internal/debug warnings and ensures meaningful content
 */
export function filterUserFacingWarnings(warnings: string[]): string[] {
  return warnings.filter(warning => 
    !warning.toLowerCase().includes('internal') &&
    !warning.toLowerCase().includes('debug') &&
    warning.length > 10 // Filter out very short warnings
  );
}

/**
 * Extract actionable insights from warnings from unified-response-adapter.ts
 * Identifies suggestions and recommendations for users
 */
export function extractInsights(warnings: string[]): string[] {
  return warnings
    .filter(warning => 
      warning.toLowerCase().includes('recommend') ||
      warning.toLowerCase().includes('consider') ||
      warning.toLowerCase().includes('suggest')
    )
    .slice(0, 3); // Limit to top 3 insights
}

/**
 * UI-specific section data validation from section-data-processor.ts
 * Ensures data structure is safe for collapsible sections UI
 */
export function validateSectionDataStructure(sectionData: any): boolean {
  // At minimum, we need referenced files to be an array
  if (!Array.isArray(sectionData?.referencedFiles)) {
    return false;
  }

  // Validate generated code if present
  if (sectionData.generatedCode) {
    if (!sectionData.generatedCode.content || !sectionData.generatedCode.language) {
      return false;
    }
  }

  // Validate original file if present
  if (sectionData.originalFile) {
    if (!sectionData.originalFile.content || !sectionData.originalFile.filename) {
      return false;
    }
  }

  // Validate diff data if present
  if (sectionData.diffView) {
    if (!sectionData.diffView.original && !sectionData.diffView.modified) {
      return false;
    }
  }

  return true;
}

/**
 * Flexible diff data processing from section-data-processor.ts
 * Handles both object and string diff formats gracefully
 */
export function processDiffData(diffData: any): any {
  if (!diffData) return undefined;
  
  if (typeof diffData === 'object') {
    return {
      original: diffData.original || '',
      modified: diffData.modified || diffData.new || '',
      filename: diffData.filename || 'modified-file'
    };
  } else if (typeof diffData === 'string') {
    // Handle string diff format - graceful fallback
    return {
      original: 'Original content not available',
      modified: diffData,
      filename: 'modified-file'
    };
  }
  
  return undefined;
}