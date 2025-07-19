export interface GenerationRequest {
  type: 'improvement' | 'feature' | 'fix' | 'refactor' | 'generate';
  prompt: string;
  targetFile?: string;
  context?: string[];
  language?: string;
  framework?: string;
}

export interface CodeSuggestion {
  id: string;
  line: number;
  type: 'performance' | 'security' | 'style' | 'bug';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface GenerationResult {
  id: string;
  type: GenerationRequest['type'];
  originalCode?: string;
  generatedCode: string;
  explanation: string;
  filename: string;
  language: string;
  confidence: number;
  suggestions: CodeSuggestion[];
}

export interface CodeGenerationPanelProps {
  projectId: string;
  availableFiles: string[];
  onGenerate: (request: GenerationRequest) => Promise<GenerationResult>;
  onApplyChanges: (result: GenerationResult) => Promise<void>;
}

export interface GenerationInputFormProps {
  availableFiles: string[];
  request: GenerationRequest;
  onRequestChange: (request: GenerationRequest) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export interface GenerationResultsListProps {
  results: GenerationResult[];
  activeResult: string | null;
  onResultSelect: (id: string | null) => void;
  onApplyChanges: (result: GenerationResult) => Promise<void>;
}

export interface ResultItemProps {
  result: GenerationResult;
  isActive: boolean;
  onToggle: () => void;
  onApplyChanges: (result: GenerationResult) => Promise<void>;
}

export interface ResultTabsProps {
  result: GenerationResult;
  onApplyChanges: (result: GenerationResult) => Promise<void>;
}

export interface SuggestionsListProps {
  suggestions: CodeSuggestion[];
}