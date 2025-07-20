import type { ReactNode } from 'react';

export interface ProjectContext {
  availableFiles: string[];
  techStack: string[];
  recentQueries: string[];
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

export interface QueryIntent {
  type: string;
  confidence: number;
  targetFiles?: string[];
}