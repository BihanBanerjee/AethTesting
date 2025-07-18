// src/app/(protected)/dashboard/ask-question-card/hooks/use-api-mutations.ts
import { api } from '@/trpc/react';
import useRefetch from '@/hooks/use-refetch';
import type { ApiMutations } from '../types/enhanced-response';

export function useApiMutations(): ApiMutations & { refetch: () => void } {
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();

  // Enhanced API mutations for different intents
  const askQuestion = api.project.askQuestionWithIntent.useMutation();
  const generateCode = api.project.generateCode.useMutation();
  const improveCode = api.project.improveCode.useMutation();
  const reviewCode = api.project.reviewCode.useMutation();
  const debugCode = api.project.debugCode.useMutation();

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