// src/app/(protected)/dashboard/actions/types/requirements.ts
export interface CodeGenerationRequirements {
  framework?: string;
  language?: string;
  features?: string[];
  constraints?: string[];
}

export interface DebugRequirements {
  errorDescription: string;
  projectId: string;
  suspectedFiles?: string[];
}

export interface ImprovementRequirements {
  code: string;
  improvementGoals: string;
  projectId: string;
  improvementType: 'performance' | 'readability' | 'security' | 'optimization';
}

export interface QuestionRequirements {
  question: string;
  projectId: string;
  intent?: string;
}

export interface SearchConfig {
  similarityThreshold: number;
  resultLimit: number;
  contextWindow: number;
}