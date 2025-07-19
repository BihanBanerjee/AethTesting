import type { DiffLine, DiffStats } from './types';

export const generateDiff = (original: string, modified: string): DiffLine[] => {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  // Simple diff algorithm (you might want to use a proper diff library)
  const diff: DiffLine[] = [];
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || '';
    const modifiedLine = modifiedLines[i] || '';
    
    if (originalLine === modifiedLine) {
      diff.push({
        type: 'unchanged' as const,
        originalLineNumber: i + 1,
        modifiedLineNumber: i + 1,
        content: originalLine
      });
    } else if (originalLine && !modifiedLine) {
      diff.push({
        type: 'removed' as const,
        originalLineNumber: i + 1,
        modifiedLineNumber: null,
        content: originalLine
      });
    } else if (!originalLine && modifiedLine) {
      diff.push({
        type: 'added' as const,
        originalLineNumber: null,
        modifiedLineNumber: i + 1,
        content: modifiedLine
      });
    } else {
      diff.push({
        type: 'changed' as const,
        originalLineNumber: i + 1,
        modifiedLineNumber: i + 1,
        originalContent: originalLine,
        modifiedContent: modifiedLine
      });
    }
  }
  
  return diff;
};

export const calculateStats = (diff: DiffLine[]): DiffStats => {
  return {
    additions: diff.filter(line => line.type === 'added' || line.type === 'changed').length,
    deletions: diff.filter(line => line.type === 'removed' || line.type === 'changed').length,
    unchanged: diff.filter(line => line.type === 'unchanged').length
  };
};

export const generateDiffText = (diff: DiffLine[]): string => {
  return diff.map(line => {
    if (line.type === 'added') return `+ ${line.content}`;
    if (line.type === 'removed') return `- ${line.content}`;
    if (line.type === 'changed') return `- ${line.originalContent}\n+ ${line.modifiedContent}`;
    return `  ${line.content}`;
  }).join('\n');
};

export const getLineStyle = (type: string): string => {
  switch (type) {
    case 'added':
      return 'bg-green-500/10 border-l-2 border-green-500/50 text-green-100';
    case 'removed':
      return 'bg-red-500/10 border-l-2 border-red-500/50 text-red-100';
    case 'changed':
      return 'bg-yellow-500/10 border-l-2 border-yellow-500/50 text-yellow-100';
    default:
      return 'text-white/80';
  }
};

export const getLinePrefix = (type: string): string => {
  switch (type) {
    case 'added':
      return '+';
    case 'removed':
      return '-';
    default:
      return ' ';
  }
};