import { useMemo, useCallback } from 'react';
import { useQAFilters } from './use-qa-filters';
import { useQAUIState } from './use-qa-ui-state';
import { useQAData } from './use-qa-data';
import type { Question } from '@/app/(protected)/qa/types/question';

export interface QAComposition {
  // Data
  questions: Question[];
  statistics: any;
  isLoading: boolean;
  selectedQuestion: Question | null;
  
  // Filters
  filters: any;
  handleFilterChange: (newFilters: any) => void;
  resetFilters: () => void;
  
  // UI State
  selectedQuestionIndex: number | null;
  activeTab: string;
  analyticsMode: 'basic' | 'advanced';
  deleteDialogOpen: boolean;
  questionToDelete: string | null;
  setActiveTab: (tab: string) => void;
  setAnalyticsMode: (mode: 'basic' | 'advanced') => void;
  setDeleteDialogOpen: (open: boolean) => void;
  
  // Actions
  openQuestion: (index: number) => void;
  closeQuestion: () => void;
  handleDeleteQuestion: (questionId: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  
  // Utilities
  refetch: () => void;
  resetAll: () => void;
}

export function useQAComposition(): QAComposition {
  const filtersState = useQAFilters();
  const uiState = useQAUIState();
  const dataState = useQAData(filtersState.filters);

  const selectedQuestion = useMemo(() => {
    return uiState.selectedQuestionIndex !== null 
      ? dataState.questions[uiState.selectedQuestionIndex] || null
      : null;
  }, [uiState.selectedQuestionIndex, dataState.questions]);

  const confirmDelete = useCallback(() => {
    if (uiState.questionToDelete) {
      dataState.deleteQuestion(uiState.questionToDelete);
    }
    uiState.setDeleteDialogOpen(false);
    uiState.setQuestionToDelete(null);
  }, [uiState.questionToDelete, dataState.deleteQuestion, uiState.setDeleteDialogOpen, uiState.setQuestionToDelete]);

  const cancelDelete = useCallback(() => {
    uiState.setDeleteDialogOpen(false);
    uiState.setQuestionToDelete(null);
  }, [uiState.setDeleteDialogOpen, uiState.setQuestionToDelete]);

  const resetAll = useCallback(() => {
    filtersState.resetFilters();
    uiState.resetUIState();
  }, [filtersState.resetFilters, uiState.resetUIState]);

  return {
    // Data
    questions: dataState.questions,
    statistics: dataState.statistics,
    isLoading: dataState.isLoading,
    selectedQuestion,
    
    // Filters
    filters: filtersState.filters,
    handleFilterChange: filtersState.setFilters,
    resetFilters: filtersState.resetFilters,
    
    // UI State
    selectedQuestionIndex: uiState.selectedQuestionIndex,
    activeTab: uiState.activeTab,
    analyticsMode: uiState.analyticsMode,
    deleteDialogOpen: uiState.deleteDialogOpen,
    questionToDelete: uiState.questionToDelete,
    setActiveTab: uiState.setActiveTab,
    setAnalyticsMode: uiState.setAnalyticsMode,
    setDeleteDialogOpen: uiState.setDeleteDialogOpen,
    
    // Actions
    openQuestion: uiState.openQuestion,
    closeQuestion: uiState.closeQuestion,
    handleDeleteQuestion: uiState.handleDeleteQuestion,
    confirmDelete,
    cancelDelete,
    
    // Utilities
    refetch: dataState.refetch,
    resetAll,
  };
}