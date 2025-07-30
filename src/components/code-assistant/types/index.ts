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
  // Base metadata fields
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
  responseType?: string;
  
  // Enhanced metadata for different response types
  warnings?: string[];
  dependencies?: string[];
  
  // Code generation specific metadata
  codeGenerationMetadata?: {
    language: string;
    framework: string;
    warnings: string[];
    dependencies: string[];
  };
  
  // Code improvement specific metadata
  improvementMetadata?: {
    improvements: CodeSuggestion[];
    hasBeforeAfter: boolean;
  };
  
  // Code review specific metadata
  reviewMetadata?: {
    issues: ReviewIssue[];
    qualityScore?: number;
    filesReviewed: string[];
    criticalIssues: ReviewIssue[];
    totalIssues: number;
  };
  
  // Debug specific metadata
  debugMetadata?: {
    rootCause?: string;
    solutions: DebugSolution[];
    suspectedFiles: string[];
    investigationSteps: string[];
    hasRootCause: boolean;
    solutionsCount: number;
  };
  
  // Refactor specific metadata
  refactorMetadata?: {
    refactoringPlan?: {
      goals: string[];
      steps: string[];
      risks: string[];
    };
    hasRefactoredCode: boolean;
    goals: string[];
    risks: string[];
  };
  
  // Explain specific metadata
  explainMetadata?: {
    codeExplanation?: {
      overview: string;
      keyPoints: string[];
      complexity: number;
      recommendations: string[];
    };
    complexity?: number;
    keyPoints: string[];
    recommendations: string[];
  };
}

export interface CodeSuggestion {
  type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
  description: string;
  code?: string;
}

export interface ReviewIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  line?: number;
  file?: string;
  suggestion?: string;
}

export interface DebugSolution {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: string;
}

export interface ProjectContext {
  availableFiles: string[];
  techStack: string[];
  recentQueries: string[];
}

export type ProcessingStage = 'analyzing' | 'processing' | 'generating' | 'complete' | 'error';

export type ActiveTab = 'chat' | 'generation' | 'files';