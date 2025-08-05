'use client';

import type { 
  EnhancedResponse, 
  SectionData, 
  CodeData, 
  FileData, 
  DiffData,
  FileReference
} from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';
import { 
  getLanguageFromFilename, 
  validateSectionDataStructure, 
  processDiffData,
  safelyProcessResponse 
} from './shared-utilities';

/**
 * Processes an EnhancedResponse and transforms it into SectionData
 * for use with the collapsible sections UI
 */
export const processResponseData = async (
  response: EnhancedResponse,
  projectId?: string
): Promise<SectionData> => {
  const sectionData: SectionData = {
    referencedFiles: response.filesReferences || []
  };

  // Process generated code
  if (response.metadata?.generatedCode) {
    sectionData.generatedCode = {
      content: response.metadata.generatedCode,
      language: response.metadata.language || 'typescript',
      filename: response.metadata.files?.[0]
    };
  }

  // Process diff data using shared utility
  if (response.metadata?.diff) {
    sectionData.diffView = processDiffData(response.metadata.diff);
    if (sectionData.diffView) {
      sectionData.diffView.filename = response.metadata.files?.[0] || sectionData.diffView.filename;
    }
  }

  // Process original file data for code improvement/debug scenarios
  if (response.intent?.targetFiles && response.intent.targetFiles.length > 0 && projectId) {
    const targetFile = response.intent.targetFiles[0];
    if (targetFile) {
      try {
        const originalContent = await getOriginalFileContent(targetFile, projectId);
        if (originalContent) {
          sectionData.originalFile = {
            content: originalContent.content,
            filename: targetFile,
            language: getLanguageFromFilename(targetFile)
          };
        }
      } catch (error) {
        console.warn('Failed to fetch original file content:', error);
      }
    }
  }

  return sectionData;
};

/**
 * Fetches original file content from the database
 * This would typically query the SourceCodeEmbedding table
 */
const getOriginalFileContent = async (
  filename: string, 
  projectId: string
): Promise<{ content: string } | null> => {
  // TODO: Implement actual database query
  // For now, return null to indicate no original file available
  // In production, this would query the database:
  // const file = await db.sourceCodeEmbedding.findFirst({
  //   where: { fileName: filename, projectId },
  //   select: { sourceCode: true }
  // });
  // return file ? { content: file.sourceCode } : null;
  
  return null;
};

/**
 * Validates section data to ensure all required fields are present
 * Uses shared validation utility with UI-specific checks
 */
export const validateSectionData = (sectionData: SectionData): boolean => {
  return validateSectionDataStructure(sectionData);
};

/**
 * Creates mock section data for testing purposes
 */
export const createMockSectionData = (intent: string): SectionData => {
  const mockFileReferences: FileReference[] = [
    {
      fileName: 'src/components/example.tsx',
      sourceCode: 'export const Example = () => <div>Hello World</div>;',
      summary: 'A simple React component example'
    }
  ];

  const sectionData: SectionData = {
    referencedFiles: mockFileReferences
  };

  if (intent === 'code_generation') {
    sectionData.generatedCode = {
      content: 'const newFunction = () => {\n  return "Generated code";\n};',
      language: 'typescript',
      filename: 'generated-function.ts'
    };
  }

  if (intent === 'code_improvement') {
    sectionData.generatedCode = {
      content: 'const improvedFunction = () => {\n  // Improved implementation\n  return "Better code";\n};',
      language: 'typescript',
      filename: 'improved-function.ts'
    };
    
    sectionData.originalFile = {
      content: 'const oldFunction = () => {\n  return "Old code";\n};',
      filename: 'src/old-function.ts',
      language: 'typescript'
    };

    sectionData.diffView = {
      original: 'const oldFunction = () => {\n  return "Old code";\n};',
      modified: 'const improvedFunction = () => {\n  // Improved implementation\n  return "Better code";\n};',
      filename: 'src/function.ts'
    };
  }

  return sectionData;
};