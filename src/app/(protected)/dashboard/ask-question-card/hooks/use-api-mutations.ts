// src/app/(protected)/dashboard/ask-question-card/hooks/use-api-mutations.ts
import { api } from '@/trpc/react';
import useRefetch from '@/hooks/use-refetch';
import type { ApiMutations } from '../types/enhanced-response';

export function useApiMutations(): ApiMutations & { refetch: () => void } {
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();
  
  // Unified mutation - handles all intent types
  const askQuestion = api.project.askQuestionWithIntent.useMutation();

  return {
    askQuestion,
    saveAnswer,
    refetch,
  };
}