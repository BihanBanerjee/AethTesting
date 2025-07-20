import type { QueryIntent } from '@/lib/intent-classifier';

export interface ProjectContext {
  availableFiles?: string[];
  techStack?: string[];
  recentQueries?: string[];
  [key: string]: unknown;
}

export interface IntentClassifierContextType {
  classifier: any | null;
  classifyQuery: (query: string, context?: ProjectContext) => Promise<QueryIntent>;
  isReady: boolean;
  hasApiKey: boolean;
  error: string | null;
}