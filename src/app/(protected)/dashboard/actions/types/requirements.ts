// src/app/(protected)/dashboard/actions/types/requirements.ts
import type { ImprovementType } from './action-types';

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
  improvementType: ImprovementType;
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