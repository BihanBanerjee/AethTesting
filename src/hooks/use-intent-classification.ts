// src/hooks/use-intent-classification.ts
import { useCallback } from 'react';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';
import type { QueryIntent } from '@/lib/intent-classifier';

// Default intent for fallback scenarios
const DEFAULT_INTENT: QueryIntent = {
  type: 'question',
  confidence: 0.5,
  requiresCodeGen: false,
  requiresFileModification: false,
  contextNeeded: 'project'
} as const;

/**
 * Hook for intent classification functionality
 * 
 * Responsibilities:
 * - Classify user queries into intents
 * - Manage classification loading states
 * - Handle classification errors with fallbacks
 * - Provide type-safe QueryIntent results
 * 
 * @returns Object containing classification function and state
 */
export function useIntentClassification() {
  const { project } = useProject();
  
  // Classification mutation with proper error handling
  const classifyMutation = api.project.classifyIntent.useMutation({
    retry: 1, // Allow 1 retry for transient failures
    onError: (error) => {
      console.error('Intent classification failed:', error);
    }
  });
  
  /**
   * Classify a user query into an intent
   * @param query - The user's query string
   * @returns Promise resolving to QueryIntent
   */
  const classifyQuery = useCallback(async (query: string): Promise<QueryIntent> => {
    try {
      if (!project?.id) {
        console.warn('Project not available - using default intent');
        return DEFAULT_INTENT;
      }
      
      if (!query.trim()) {
        console.warn('Empty query provided - using default intent');
        return DEFAULT_INTENT;
      }
      
      // Use server-side classification for security and accuracy
      const result = await classifyMutation.mutateAsync({
        projectId: project.id,
        query: query.trim(),
      });
      
      return result.intent;
    } catch (error) {
      console.error('Intent classification failed, using default:', error);
      return DEFAULT_INTENT;
    }
  }, [project?.id]);
  
  return {
    // Core functionality
    classifyQuery,
    
    // Loading states
    isClassifying: classifyMutation.isPending,
    
    // Error state
    classificationError: classifyMutation.error,
    
    // Convenience flags
    canClassify: !!project?.id,
    
    // Raw mutation for advanced usage
    classifyMutation,
  };
}