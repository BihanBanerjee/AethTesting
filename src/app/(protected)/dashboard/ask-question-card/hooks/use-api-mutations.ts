// src/app/(protected)/dashboard/ask-question-card/hooks/use-api-mutations.ts
import { api } from '@/trpc/react';
import useRefetch from '@/hooks/use-refetch';
import type { ApiMutations } from '../types/enhanced-response';

export function useApiMutations(): ApiMutations & { refetch: () => void } {
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();
  
  // Main unified mutation
  const askQuestion = api.project.askQuestionWithIntent.useMutation();
  
  // Create wrapper mutations that maintain the same interface but use the unified endpoint
  const generateCode = {
    mutateAsync: async (input: any) => 
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.prompt,
        contextFiles: input.context,
        requirements: input.requirements,
        intent: 'code_generation'
      })
  };

  const improveCode = {
    mutateAsync: async (input: any) =>
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.suggestions,
        contextFiles: input.targetFiles,
        improvementType: input.improvementType,
        intent: 'code_improvement'
      })
  };

  const reviewCode = {
    mutateAsync: async (input: any) =>
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.focusAreas || 'Perform comprehensive code review',
        contextFiles: input.files,
        reviewType: input.reviewType,
        focusAreas: input.focusAreas,
        intent: 'code_review'
      })
  };

  const debugCode = {
    mutateAsync: async (input: any) =>
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.errorDescription,
        errorDescription: input.errorDescription,
        contextFiles: input.suspectedFiles,
        contextLevel: input.contextLevel,
        intent: 'debug'
      })
  };

  return {
    askQuestion,
    generateCode,
    improveCode,
    reviewCode,
    debugCode,
    saveAnswer,
    refetch,
  };
}