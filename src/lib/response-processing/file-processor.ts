// src/lib/response-processing/file-processor.ts
import type { EnhancedFileReference } from './types/file-reference';
import { determineFileType, isGeneratedFile } from './file-type-detector';

export function processFileReferences(files: any[]): EnhancedFileReference[] {
  return files.map(file => {
    const fileName = file.fileName;
    const fileType = determineFileType(fileName);
    const isGenerated = isGeneratedFile(fileType);
    
    return {
      fileName,
      sourceCode: file.sourceCode,
      summary: file.summary,
      fileType,
      isGenerated
    };
  });
}

export function groupFilesByType(files: EnhancedFileReference[]): Record<string, EnhancedFileReference[]> {
  return files.reduce((groups, file) => {
    const key = file.isGenerated ? 'generated' : 'original';
    if (!groups[key]) groups[key] = [];
    groups[key].push(file);
    return groups;
  }, {} as Record<string, EnhancedFileReference[]>);
}