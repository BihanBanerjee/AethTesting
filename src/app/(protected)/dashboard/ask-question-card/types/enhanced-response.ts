// src/app/(protected)/dashboard/ask-question-card/types/enhanced-response.ts
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

export type ProcessingStage = 'analyzing' | 'processing' | 'generating' | 'complete';

export type ActiveTab = 'response' | 'code' | 'files';

export type IntentType = 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';

export interface QuestionState {
  open: boolean;
  question: string;
  loading: boolean;
  response: EnhancedResponse | null;
  activeTab: ActiveTab;
  intentPreview: any;
  processingStage: ProcessingStage;
  selectedFiles: string[];
  availableFiles: string[];
  showModal: boolean;
  streamingContent: string;
}

export interface FileReference {
  fileName: string;
  sourceCode: string;
  summary: string;
}

export interface ApiMutations {
  askQuestion: any;
  generateCode: any;
  improveCode: any;
  reviewCode: any;
  debugCode: any;
  saveAnswer: any;
}