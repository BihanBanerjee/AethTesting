export interface FileCountResult {
  count: number;
  method: 'git-tree' | 'directory-traversal';
}

export interface IndexingResult {
  summary: string;
  embedding: number[];
  sourceCode: string;
  fileName: string;
}

export interface IndexingStats {
  totalFiles: number;
  successfullyProcessed: number;
  errors: number;
}