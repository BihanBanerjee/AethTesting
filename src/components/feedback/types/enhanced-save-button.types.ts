import type { FileReference } from '@/app/(protected)/dashboard/actions/types/action-types';

export interface EnhancedResponse {
  type: 'answer' | 'code' | 'review' | 'debug' | 'explanation';
  content: string;
  intent: {
    type: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
    confidence: number;
    requiresCodeGen: boolean;
    requiresFileModification: boolean;
    contextNeeded: 'file' | 'function' | 'project' | 'global';
    targetFiles?: string[];
  };
  metadata?: {
    generatedCode?: string;
    language?: string;
    diff?: string;
    suggestions?: Array<{
      type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
      description: string;
      code?: string;
    }>;
    issues?: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      suggestion: string;
    }>;
    files?: string[];
    warnings?: string[];
    dependencies?: string[];
  };
  filesReferences?: {fileName: string; sourceCode: string; summary: string}[];
  timestamp?: Date;
}

export interface Project {
  id: string;
  name: string;
}

// Re-export FileReference from action-types to avoid duplication
export type { FileReference } from '@/app/(protected)/dashboard/actions/types/action-types';

export interface FeedbackData {
  rating?: number;
  helpful?: boolean;
  feedback?: string;
  applied?: boolean;
  modified?: boolean;
}

export interface IntentMetadata {
  type: string;
  confidence: number;
  requiresCodeGen: boolean;
  requiresFileModification: boolean;
  contextNeeded: string;
  targetFiles: string[];
}

export interface GeneratedCodeMetadata {
  content: string;
  language: string;
  filename: string;
  type: 'code_snippet' | 'new_file';
}

export interface ImprovementsMetadata {
  improvedCode: string;
  improvementType: 'optimization';
  diff?: string;
  suggestions?: Array<{
    type: string;
    description: string;
    code?: string;
  }>;
}

export interface ReviewMetadata {
  reviewType: 'comprehensive';
  issues?: Array<{
    type: string;
    severity: string;
    description: string;
    suggestion: string;
  }>;
  summary: string;
}

export interface DebugMetadata {
  diagnosis: string;
  solutions?: Array<{
    type: 'fix';
    description: string;
    code?: string;
    priority: 'medium';
  }>;
  investigationSteps: unknown[];
}

export interface ExplanationMetadata {
  detailLevel: 'detailed';
  keyPoints: unknown[];
  codeFlow: unknown[];
  patterns: unknown[];
  dependencies: string[];
}

export interface RefactorMetadata {
  refactoredCode?: string;
  changes: unknown[];
  preserveAPI: boolean;
  apiChanges: string[];
}

export interface EnhancedMetadata {
  intent?: IntentMetadata;
  generatedCode?: GeneratedCodeMetadata;
  improvements?: ImprovementsMetadata;
  review?: ReviewMetadata;
  debug?: DebugMetadata;
  explanation?: ExplanationMetadata;
  refactor?: RefactorMetadata;
  performance: {
    processingTime: number;
    responseTime: number;
  };
  filesReferences: FileReference[];
  contextFiles: string[];
  userFeedback?: FeedbackData;
  sessionId: string;
  timestamp: Date;
}

export interface SaveAnswerData {
  projectId: string;
  question: string;
  answer: string;
  filesReferences: FileReference[];
  metadata: EnhancedMetadata | Record<string, never>;
}

export interface SaveAnswerResult {
  analytics?: {
    aiInteractionCreated?: boolean;
    codeGenerationCreated?: boolean;
    fileAnalyticsUpdated?: number;
    suggestionFeedbackCreated?: boolean;
  };
}

export interface SaveAnswerMutation {
  mutate: (data: SaveAnswerData, options?: { onSuccess?: (result: SaveAnswerResult) => void; onError?: (error: Error) => void }) => void;
  isPending: boolean;
}

export interface EnhancedSaveButtonProps {
  response: EnhancedResponse | null;
  project: Project | null;
  question: string;
  selectedFiles: string[];
  saveAnswer: SaveAnswerMutation;
  refetch: () => void;
}