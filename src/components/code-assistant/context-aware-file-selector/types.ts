export interface ContextAwareFileSelectorProps {
  availableFiles: string[];
  selectedFiles: string[];
  onFileSelectionChange: (files: string[]) => void;
  currentQuery?: string;
}

export interface FileSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}

export interface SuggestedFilesPanelProps {
  suggestedFiles: string[];
  currentQuery?: string;
  onFileToggle: (file: string) => void;
  onSelectAll: () => void;
}

export interface SelectedFilesPanelProps {
  selectedFiles: string[];
  onFileToggle: (file: string) => void;
  onClearAll: () => void;
}

export interface FileListProps {
  files: string[];
  selectedFiles: string[];
  suggestedFiles: string[];
  onFileToggle: (file: string) => void;
}

export interface IntentClassificationResult {
  type: string;
  targetFiles?: string[];
}

export type IntentType = 'code_generation' | 'debug' | 'code_review' | 'refactor' | 'explain' | 'question';