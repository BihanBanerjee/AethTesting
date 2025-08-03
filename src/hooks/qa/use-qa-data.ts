import { useCallback } from 'react';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';
import type { QAFilters } from './use-qa-filters';
import type { Question } from '@/app/(protected)/qa/types/question';

export interface QADataState {
  questions: Question[];
  statistics: any;
  isLoading: boolean;
  refetch: () => void;
  deleteQuestion: (questionId: string) => void;
  isDeleting: boolean;
}

export function useQAData(filters: QAFilters): QADataState {
  const { projectId } = useProject();

  // Enhanced query with filters
  const { data: questionsData, isLoading, refetch } = api.project.getQuestions.useQuery({
    projectId,
    intent: filters.intent,
    timeRange: filters.timeRange,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  }, {
    enabled: !!projectId
  });

  // Get statistics
  const { data: statistics } = api.project.getQuestionStatistics.useQuery({
    projectId,
    timeRange: filters.timeRange
  }, {
    enabled: !!projectId
  });

  // Delete question mutation
  const deleteQuestionMutation = api.project.deleteQuestion.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Failed to delete question:', error);
    }
  });

  const deleteQuestion = useCallback((questionId: string) => {
    deleteQuestionMutation.mutate({ questionId });
  }, [deleteQuestionMutation]);

  const questions = (questionsData?.questions || []) as Question[];

  return {
    questions,
    statistics,
    isLoading,
    refetch,
    deleteQuestion,
    isDeleting: deleteQuestionMutation.isPending,
  };
}