// src/lib/code-generation/types.ts
import type { QueryIntent } from "../intent-classifier/types";

export interface CodeGenerationRequest {
  intent: QueryIntent;
  query: string;
  projectId: string;
  contextFiles?: string[];
  targetFile?: string;
  insertionPoint?: { line: number; column: number };
}

export interface CodeGenerationResult {
  type: 'new_file' | 'file_modification' | 'code_snippet' | 'multiple_files';
  files: GeneratedFile[];
  explanation: string;
  warnings?: string[];
  dependencies?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  changeType: 'create' | 'modify' | 'replace';
  diff?: string;
  insertionPoint?: { line: number; column: number };
}

