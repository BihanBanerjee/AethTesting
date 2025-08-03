// src/hooks/use-unified-intent-routing.ts
import { useCallback } from 'react';
import { api } from '@/trpc/react';
import type { QueryIntent } from '@/lib/intent-classifier';

/**
 * Unified hook for intent routing across all pages (dashboard, qa, code-assistant)
 * Eliminates duplication between intent-router.ts and use-api-routing.ts
 * 
 * Responsibilities:
 * - Single source of truth for askQuestionWithIntent calls
 * - Consistent intent-specific parameter handling
 * - Type-safe request building
 * - Error handling and retry logic
 */
export function useUnifiedIntentRouting() {
  const askQuestionMutation = api.project.askQuestionWithIntent.useMutation({
    retry: 1,
    onError: (error) => {
      console.error('Intent routing failed:', error);
    }
  });

  /**
   * Route intent to the unified askQuestionWithIntent endpoint
   * @param intent - Classified intent object
   * @param query - User's query string
   * @param projectId - Project identifier
   * @param contextFiles - Selected files for context
   * @returns Promise resolving to API response
   */
  const routeIntent = useCallback(async (
    intent: QueryIntent,
    query: string,
    projectId: string,
    contextFiles: string[] = []
  ) => {
    // Build base request data
    const requestData = {
      projectId,
      query,
      contextFiles: contextFiles.length > 0 ? contextFiles : intent.targetFiles || [],
      intent: intent.type,
      // Intent-specific optional parameters
      requirements: undefined as { framework?: string; language?: string; features?: string[]; constraints?: string[] } | undefined,
      improvementType: undefined as 'performance' | 'readability' | 'security' | 'optimization' | undefined,
      reviewType: undefined as 'security' | 'performance' | 'comprehensive' | undefined,
      focusAreas: undefined as string | undefined,
      errorDescription: undefined as string | undefined,
      contextLevel: undefined as 'file' | 'function' | 'project' | 'global' | undefined,
      refactoringGoals: undefined as string | undefined,
      preserveAPI: undefined as boolean | undefined,
      detailLevel: undefined as 'brief' | 'detailed' | 'comprehensive' | undefined
    };

    // Add intent-specific parameters
    switch (intent.type) {
      case 'code_generation':
        requestData.requirements = {
          framework: 'react',
          language: 'typescript'
        };
        break;

      case 'code_improvement':
        requestData.improvementType = 'optimization';
        break;

      case 'code_review':
        requestData.reviewType = 'comprehensive';
        requestData.focusAreas = query;
        break;

      case 'debug':
        requestData.errorDescription = query;
        requestData.contextLevel = 'project';
        break;

      case 'refactor':
        requestData.refactoringGoals = query;
        requestData.preserveAPI = true;
        break;

      case 'explain':
        requestData.detailLevel = 'detailed';
        break;

      case 'question':
      default:
        // No additional parameters needed for basic questions
        break;
    }

    return await askQuestionMutation.mutateAsync(requestData);
  }, [askQuestionMutation.mutateAsync]); // Only depend on the stable mutateAsync function

  return {
    // Core functionality
    routeIntent,
    
    // Loading states
    isLoading: askQuestionMutation.isPending,
    
    // Error state
    error: askQuestionMutation.error,
    
    // Success state
    isSuccess: askQuestionMutation.isSuccess,
    
    // Reset function
    reset: askQuestionMutation.reset,
    
    // Raw mutation for advanced usage
    mutation: askQuestionMutation,
  };
}