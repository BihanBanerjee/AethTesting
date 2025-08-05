export interface QueryIntent {
  type: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
  confidence: number;
  targetFiles?: string[];
  requiresCodeGen: boolean;
  requiresFileModification: boolean;
  contextNeeded: 'file' | 'function' | 'project' | 'global';
}