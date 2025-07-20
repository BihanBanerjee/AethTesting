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

export interface SaveAnswerMutation {
  mutate: (data: any, options?: { onSuccess?: (result: any) => void; onError?: (error: any) => void }) => void;
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

export interface FileReference {
  fileName: string;
  sourceCode: string;
  summary: string;
}

export interface EnhancedMetadata {
  intent?: any;
  generatedCode?: any;
  improvements?: any;
  review?: any;
  debug?: any;
  explanation?: any;
  refactor?: any;
  performance: {
    processingTime: number;
    responseTime: number;
  };
  filesReferences: FileReference[];
  contextFiles: string[];
  userFeedback?: any;
  sessionId: string;
  timestamp: Date;
}