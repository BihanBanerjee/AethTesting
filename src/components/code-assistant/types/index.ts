import type { StreamableValue } from 'ai/rsc';

export type IntentType = 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string | StreamableValue<string>;
  intent?: IntentType;
  confidence?: number;
  metadata?: MessageMetadata;
  timestamp: Date;
}

export interface MessageMetadata {
  files?: string[];
  generatedCode?: string;
  language?: string;
  diff?: {
    original: string;
    modified: string;
    filename: string;
  };
  suggestions?: CodeSuggestion[];
  requiresCodeGen?: boolean;
  requiresFileModification?: boolean;
  targetFiles?: string[];
}

export interface CodeSuggestion {
  type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
  description: string;
  code?: string;
}

export interface ProjectContext {
  availableFiles: string[];
  techStack: string[];
  recentQueries: string[];
}

export type ProcessingStage = 'analyzing' | 'processing' | 'generating' | 'complete' | 'error';

export type ActiveTab = 'chat' | 'generation' | 'files';