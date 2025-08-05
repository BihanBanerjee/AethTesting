import type { ReactNode } from 'react';

export interface ProjectContext {
  projectId?: string;
  availableFiles?: string[];
  techStack?: string[];
  recentQueries?: string[];
  [key: string]: unknown;
}

export interface SmartInputSuggestionsProps {
  currentInput: string;
  onSuggestionSelect: (suggestion: string) => void;
  projectContext?: ProjectContext;
}

export interface SuggestionPrediction {
  suggestion: string;
  intent: string;
  confidence: number;
  icon: ReactNode;
}