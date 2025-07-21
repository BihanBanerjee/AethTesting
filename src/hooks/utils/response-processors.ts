import type { QueryIntent } from '@/lib/intent-classifier';
import type { MessageMetadata, CodeSuggestion } from '@/components/code-assistant/types';

// Define expected API response structure
interface APIResponse {
  answer?: string;
  explanation?: string;
  response?: string;
  summary?: string;
  filesReferences?: Array<{ fileName: string }>;
  files?: Array<{ fileName: string }>;
  generatedCode?: string;
  improvedCode?: string;
  refactoredCode?: string;
  language?: string;
  diff?: {
    original: string;
    modified: string;
    filename: string;
  };
  suggestions?: CodeSuggestion[];
  improvements?: CodeSuggestion[];
  issues?: CodeSuggestion[];
}

// Helper function to safely extract content from different API response types
export function extractResponseContent(response: unknown): string {
  const res = response as APIResponse;
  return res?.answer || res?.explanation || res?.response || res?.summary || 'No response received';
}

// Helper function to safely extract metadata from different API response types
export function extractResponseMetadata(response: unknown, intent: QueryIntent): MessageMetadata {
  const res = response as APIResponse;
  return {
    files: res?.filesReferences?.map((f: { fileName: string }) => f.fileName) || res?.files?.map((f: { fileName: string }) => f.fileName) || intent.targetFiles || [],
    generatedCode: res?.generatedCode || res?.improvedCode || res?.refactoredCode,
    language: res?.language,
    diff: res?.diff,
    suggestions: res?.suggestions || res?.improvements || res?.issues,
    requiresCodeGen: intent.requiresCodeGen,
    requiresFileModification: intent.requiresFileModification,
    targetFiles: intent.targetFiles
  };
}