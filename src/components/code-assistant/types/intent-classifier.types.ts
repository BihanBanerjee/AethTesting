import type { QueryIntent, IntentClassifier } from '@/lib/intent-classifier';

export interface ProjectContext {
  projectId?: string;
  availableFiles?: string[];
  techStack?: string[];
  recentQueries?: string[];
  targetFiles?: string[];
  [key: string]: unknown;
}

export interface IntentClassifierContextType {
  classifier: IntentClassifier | null;
  classifyQuery: (query: string, context?: ProjectContext) => Promise<QueryIntent>;
  isReady: boolean;
  hasApiKey: boolean;
  error: string | null;
}