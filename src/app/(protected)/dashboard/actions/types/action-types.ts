// src/app/(protected)/dashboard/actions/types/action-types.ts
export interface FileReference {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity?: number;
}

export interface ProjectContext {
  recentFiles: Array<{
    fileName: string;
    summary: string;
  }>;
  techStack: string[];
  architecture: string;
  structure: string;
  standards: CodingStandards;
}

export interface CodingStandards {
  indentation: string;
  quotes: 'single' | 'double';
  semicolons: boolean;
  estimatedLineLength: number;
}

export interface TechStackAnalysis {
  frameworks: Set<string>;
  languages: Set<string>;
  databases: Set<string>;
  styling: Set<string>;
  stateManagement: Set<string>;
  testing: Set<string>;
  buildTools: Set<string>;
  authentication: Set<string>;
  api: Set<string>;
}

export interface ArchitecturePatterns {
  'clean-architecture': number;
  'mvc': number;
  'layered': number;
  'microservices': number;
  'component-based': number;
  'jamstack': number;
}

export interface ProjectStructure {
  [directoryName: string]: ProjectStructure | string[] | undefined;
  _files?: string[];
}

export interface DatabaseFile {
  fileName: string;
  sourceCode: string;
  summary?: string;
}

export interface VectorSearchResult {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}

export type ImprovementType = 'performance' | 'readability' | 'security' | 'optimization';

export type IntentType = 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'debug' | 'refactor' | 'explain';

