// src/app/(protected)/dashboard/ask-question-card/types/enhanced-response.ts
import type { QueryIntent } from '@/lib/intent-classifier';
import type { 
  CodeGenerationInput, 
  CodeImprovementInput, 
  CodeReviewInput, 
  DebugInput 
} from '@/lib/intent-classifier/input-types';
import type { FileReference } from '../../actions/types/action-types';

// Feedback-related interfaces
export interface FeedbackData {
  rating?: number;
  helpful?: boolean;
  feedback?: string;
  interactionId?: string;
}

export interface CodeGenerationFeedback {
  id: string;
  satisfaction?: number;
  applied?: boolean;
  modified?: boolean;
}

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
    insights?: string[];        // Educational content (key points, explanations)
    dependencies?: string[];
  };
  filesReferences?: {fileName: string; sourceCode: string; summary: string}[];
  timestamp?: Date;
  
  // Feedback tracking fields
  feedback?: FeedbackData;
  codeGeneration?: CodeGenerationFeedback;
}

export type ProcessingStage = 'analyzing' | 'processing' | 'generating' | 'complete';

export type ActiveTab = 'response' | 'code' | 'files';

export interface QuestionState {
  open: boolean;
  question: string;
  loading: boolean;
  response: EnhancedResponse | null;
  activeTab: ActiveTab;
  intentPreview: QueryIntent | null;
  processingStage: ProcessingStage;
  selectedFiles: string[];
  availableFiles: string[];
  showModal: boolean;
  streamingContent: string;
}

// Re-export types from action-types to avoid duplication
export type { FileReference, IntentType } from '../../actions/types/action-types';

export interface ApiMutations {
  askQuestion: {
    mutateAsync: (input: any) => Promise<any>;
  };
  generateCode: {
    mutateAsync: (input: CodeGenerationInput) => Promise<any>;
  };
  improveCode: {
    mutateAsync: (input: CodeImprovementInput) => Promise<any>;
  };
  reviewCode: {
    mutateAsync: (input: CodeReviewInput) => Promise<any>;
  };
  debugCode: {
    mutateAsync: (input: DebugInput) => Promise<any>;
  };
  saveAnswer: {
    mutateAsync: (input: any) => Promise<any>;
  };
}

// New interfaces for collapsible sections
export type SectionPriority = 'high' | 'medium' | 'low';

export interface CodeData {
  content: string;
  language: string;
  filename?: string;
}

export interface FileData {
  content: string;
  filename: string;
  language: string;
}

export interface DiffData {
  original: string;
  modified: string;
  filename: string;
}

export interface SectionData {
  generatedCode?: CodeData;
  originalFile?: FileData;
  diffView?: DiffData;
  referencedFiles: FileReference[];
}

export interface SectionPriorities {
  generatedCode: SectionPriority;
  originalFile: SectionPriority;
  diffView: SectionPriority;
  referencedFiles: SectionPriority;
}

export interface SectionState {
  generatedCode: boolean;
  originalFile: boolean;
  diffView: boolean;
  referencedFiles: boolean;
}

export interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  actions?: React.ReactNode;
  priority?: SectionPriority;
  children: React.ReactNode;
  className?: string;
}