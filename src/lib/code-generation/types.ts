// src/lib/code-generation/types.ts
import type { QueryIntent } from "../intent-classifier";

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

export interface ProjectContext {
  relevantFiles: Array<{
    fileName: string;
    summary: string;
    sourceCode: string;
    type: string;
    exports: string[];
    imports: string[];
  }>;
  techStack: string[];
  architecturePattern: string;
  codingStandards: any;
  projectStructure: string;
}

export interface CodingStandards {
  indentation: string;
  quotes: string;
  semicolons: boolean;
  trailingCommas: boolean;
  maxLineLength: number;
}

export interface GenerationStrategy {
  generateCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult>;
}