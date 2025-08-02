// src/lib/intent-classifier/input-types.ts
// Intent-based input types using discriminated unions for type safety

// Import existing types we'll reuse
import type { ImprovementType } from '@/app/(protected)/dashboard/actions/types/action-types';
import type { CodeGenerationRequirements } from '@/app/(protected)/dashboard/actions/types/requirements';

// Base interface that all inputs share
interface BaseInput {
  projectId: string;
}

// Intent-specific input types
export interface QuestionInput extends BaseInput {
  intent: 'question';
  query: string;
  contextFiles?: string[];
}

export interface CodeGenerationInput extends BaseInput {
  intent: 'code_generation';
  prompt: string;
  context?: string[];
  requirements?: CodeGenerationRequirements;
}

export interface CodeImprovementInput extends BaseInput {
  intent: 'code_improvement';
  suggestions: string;
  targetFiles?: string[];
  improvementType?: ImprovementType;
}

export interface CodeReviewInput extends BaseInput {
  intent: 'code_review';
  files?: string[];
  reviewType?: 'security' | 'performance' | 'comprehensive';
  focusAreas?: string;
}

export interface DebugInput extends BaseInput {
  intent: 'debug';
  errorDescription: string;
  suspectedFiles?: string[];
  contextLevel?: 'file' | 'function' | 'project' | 'global';
}

export interface RefactorInput extends BaseInput {
  intent: 'refactor';
  refactoringGoals?: string;
  preserveAPI?: boolean;
  contextFiles?: string[];
}

export interface ExplainInput extends BaseInput {
  intent: 'explain';
  query: string;
  contextFiles?: string[];
  detailLevel?: 'brief' | 'detailed' | 'comprehensive';
}

// Discriminated union type that encompasses all intent-based inputs
export type IntentBasedInput = 
  | QuestionInput
  | CodeGenerationInput 
  | CodeImprovementInput
  | CodeReviewInput
  | DebugInput
  | RefactorInput
  | ExplainInput;

// Type guard functions for runtime type checking
export function isQuestionInput(input: IntentBasedInput): input is QuestionInput {
  return input.intent === 'question';
}

export function isCodeGenerationInput(input: IntentBasedInput): input is CodeGenerationInput {
  return input.intent === 'code_generation';
}

export function isCodeImprovementInput(input: IntentBasedInput): input is CodeImprovementInput {
  return input.intent === 'code_improvement';
}

export function isCodeReviewInput(input: IntentBasedInput): input is CodeReviewInput {
  return input.intent === 'code_review';
}

export function isDebugInput(input: IntentBasedInput): input is DebugInput {
  return input.intent === 'debug';
}

export function isRefactorInput(input: IntentBasedInput): input is RefactorInput {
  return input.intent === 'refactor';
}

export function isExplainInput(input: IntentBasedInput): input is ExplainInput {
  return input.intent === 'explain';
}

// Utility type to extract the input type for a specific intent
export type ExtractIntentInput<T extends IntentBasedInput['intent']> = 
  Extract<IntentBasedInput, { intent: T }>;