// src/app/(protected)/dashboard/code-references/utils/file-type-detector.ts
import type { FileType } from '../types/file-reference';

export function determineFileType(fileName: string): FileType {
  if (fileName.includes('generated-')) return 'generated';
  if (fileName.includes('improved-')) return 'improved';
  if (fileName.includes('reviewed-')) return 'reviewed';
  if (fileName.includes('debug-target-')) return 'debug_target';
  if (fileName.includes('debug-solution-')) return 'debug_solution';
  if (fileName.includes('explanation-') || fileName.includes('explained-')) return 'explanation';
  if (fileName.includes('summary-') || fileName.includes('analysis-')) return 'summary';
  return 'original';
}

export function isGeneratedFile(fileType: FileType): boolean {
  return ['generated', 'improved', 'debug_solution', 'explanation', 'summary'].includes(fileType);
}

export function getFileTypeLabel(fileType: FileType): string {
  switch (fileType) {
    case 'generated': return 'Generated';
    case 'improved': return 'Improved';
    case 'reviewed': return 'Reviewed';
    case 'debug_target': return 'Debug Target';
    case 'debug_solution': return 'Debug Solution';
    case 'explanation': return 'Explanation';
    case 'summary': return 'Summary';
    default: return 'Original';
  }
}

export function getFileTypeColor(fileType: FileType): string {
  switch (fileType) {
    case 'generated': return 'border-green-500/30 text-green-300 bg-green-500/10';
    case 'improved': return 'border-blue-500/30 text-blue-300 bg-blue-500/10';
    case 'reviewed': return 'border-purple-500/30 text-purple-300 bg-purple-500/10';
    case 'debug_target': return 'border-red-500/30 text-red-300 bg-red-500/10';
    case 'debug_solution': return 'border-green-500/30 text-green-300 bg-green-500/10';
    case 'explanation': return 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10';
    case 'summary': return 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10';
    default: return 'border-white/20 text-white/60 bg-white/5';
  }
}