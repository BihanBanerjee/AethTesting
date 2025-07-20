import type { QueryIntent, IntentClassifier } from '@/lib/intent-classifier';

export interface ProjectContext {
  availableFiles?: string[];
  techStack?: string[];
  recentQueries?: string[];
  [key: string]: unknown;
}

export interface IntentClassifierContextType {
  classifier: IntentClassifier | null;
  classifyQuery: (query: string, context?: ProjectContext) => Promise<QueryIntent>;
  isReady: boolean;
  hasApiKey: boolean;
  error: string | null;
}