import type { QueryIntent } from '@/lib/intent-classifier';

export interface IntentClassifierContextType {
  classifier: any | null;
  classifyQuery: (query: string, context?: any) => Promise<QueryIntent>;
  isReady: boolean;
  hasApiKey: boolean;
  error: string | null;
}