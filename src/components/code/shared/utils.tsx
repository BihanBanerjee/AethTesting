import { Sparkles, Code2, Zap, GitBranch, FileCode, FileText } from 'lucide-react';
import type { GenerationRequest, CodeSuggestion } from './types';

export const getTypeIcon = (type: GenerationRequest['type']) => {
  switch (type) {
    case 'improvement': return <Sparkles className="h-4 w-4" />;
    case 'feature': return <Code2 className="h-4 w-4" />;
    case 'fix': return <Zap className="h-4 w-4" />;
    case 'refactor': return <GitBranch className="h-4 w-4" />;
    case 'generate': return <FileCode className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

export const getTypeColor = (type: GenerationRequest['type']) => {
  switch (type) {
    case 'improvement': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
    case 'feature': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    case 'fix': return 'bg-red-500/20 text-red-200 border-red-500/30';
    case 'refactor': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
    case 'generate': return 'bg-green-500/20 text-green-200 border-green-500/30';
    default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
  }
};

export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'border-green-500/30 text-green-200';
  if (confidence >= 60) return 'border-yellow-500/30 text-yellow-200';
  return 'border-red-500/30 text-red-200';
};

export const getSeverityColor = (severity: CodeSuggestion['severity']) => {
  switch (severity) {
    case 'high': return 'border-red-500/30 text-red-200';
    case 'medium': return 'border-yellow-500/30 text-yellow-200';
    case 'low': return 'border-blue-500/30 text-blue-200';
    default: return 'border-gray-500/30 text-gray-200';
  }
};