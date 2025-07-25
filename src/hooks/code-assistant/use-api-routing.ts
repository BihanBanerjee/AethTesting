'use client'

import { api } from '@/trpc/react';
import type { QueryIntent } from '@/lib/intent-classifier';
import type { APIRoutingState } from '../types/use-code-assistant.types';

export function useAPIRouting(
  selectedFiles: string[]
): APIRoutingState {
  // API mutations - Smart Chat only needs askQuestion
  const askQuestion = api.project.askQuestionWithIntent.useMutation();

  const routeIntentToAPI = async (intent: QueryIntent, input: string, projectId: string) => {
    // Smart Chat only handles questions - all code intents redirect to Code Generation tab
    const codeIntents = ['code_generation', 'code_improvement', 'code_review', 'debug', 'explain', 'refactor'];
    
    if (codeIntents.includes(intent.type)) {
      // Show user message about redirecting to Code Generation tab
      throw new Error(`For ${intent.type.replace('_', ' ')} requests, please use the Code Generation tab for better specialized tools and features.`);
    }
    
    // Smart Chat only handles askQuestion for general queries
    return await askQuestion.mutateAsync({
      projectId,
      query: input,
      contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
      intent: intent.type
    });
  };

  return {
    routeIntentToAPI
  };
}