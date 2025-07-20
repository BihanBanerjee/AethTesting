export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'removed';
  content?: string;
}

export interface ReindexingResult {
  filePath: string;
  status: 'reindexed' | 'removed' | 'error';
  error?: string;
}

export interface CodebaseStructure {
  configFiles: string[];
  entryPoints: string[];
  coreFiles: string[];
  apiFiles: string[];
  schemaFiles: string[];
  testFiles: string[];
  documentationFiles: string[];
  framework: string;
}

export interface StructureAnalysis {
  keyFiles: string[];
  structure: CodebaseStructure;
}

export interface AnalysisResult {
  languages: Record<string, number>;
  structure: CodebaseStructure;
  lastAnalyzed: string;
  totalFiles: number;
  directories: number;
}