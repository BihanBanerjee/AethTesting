import type { EnhancedResponse, FileReference } from '../types/enhanced-save-button.types';

export function createEnhancedFileReferences(response: EnhancedResponse): FileReference[] {
  let enhancedFilesReferences = response.filesReferences || [];
  
  // If we have generated code but no filesReferences, create them
  if (response.metadata?.generatedCode && enhancedFilesReferences.length === 0) {
    enhancedFilesReferences = [{
      fileName: `generated-${response.intent?.type || 'code'}.${response.metadata.language === 'typescript' ? 'ts' : 'js'}`,
      sourceCode: response.metadata.generatedCode,
      summary: `Generated ${response.intent?.type || 'code'} - ${response.content.substring(0, 100)}...`
    }];
  }

  return enhancedFilesReferences;
}