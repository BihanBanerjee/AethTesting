'use client'

import { api } from '@/trpc/react';
import type { QueryIntent } from '@/lib/intent-classifier';
import type { APIRoutingState } from '../types/use-code-assistant.types';

export function useAPIRouting(
  selectedFiles: string[]
): APIRoutingState {
  // Only need the unified askQuestionWithIntent mutation now
  const askQuestionWithIntent = api.project.askQuestionWithIntent.useMutation();

  const routeIntentToAPI = async (intent: QueryIntent, input: string, projectId: string) => {
    const contextFiles = selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [];
    
    // Build request with intent-specific parameters
    const requestData: any = {
      projectId,
      query: input,
      contextFiles,
      intent: intent.type
    };

    // Add intent-specific parameters based on intent type
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
        requestData.focusAreas = input;
        break;
        
      case 'debug':
        requestData.errorDescription = input;
        requestData.contextLevel = 'file';
        break;
        
      case 'refactor':
        requestData.refactoringGoals = input;
        requestData.preserveAPI = false;
        break;
        
      case 'explain':
        requestData.detailLevel = 'detailed';
        break;
    }

    // All intents now go through the unified endpoint
    return await askQuestionWithIntent.mutateAsync(requestData);
  };

  return {
    routeIntentToAPI
  };
}