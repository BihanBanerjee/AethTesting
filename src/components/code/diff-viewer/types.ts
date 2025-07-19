export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'changed';
  originalLineNumber: number | null;
  modifiedLineNumber: number | null;
  content?: string;
  originalContent?: string;
  modifiedContent?: string;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

export interface DiffViewerProps {
  original: string;
  modified: string;
  filename: string;
  language?: string;
  mode?: 'split' | 'unified';
}

export interface DiffHeaderProps {
  filename: string;
  language: string;
  stats: DiffStats;
  viewMode: 'split' | 'unified';
  onViewModeChange: (mode: 'split' | 'unified') => void;
  onCopyDiff: () => void;
}

export interface DiffLineProps {
  line: DiffLine;
}

export interface DiffStatsProps {
  stats: DiffStats;
}

export interface UnifiedDiffViewProps {
  diff: DiffLine[];
}

export interface SplitDiffViewProps {
  original: string;
  modified: string;
}