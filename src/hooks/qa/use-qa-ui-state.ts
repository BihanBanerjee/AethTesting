import { useState, useCallback } from 'react';

export interface QAUIState {
  selectedQuestionIndex: number | null;
  activeTab: string;
  analyticsMode: 'basic' | 'advanced';
  deleteDialogOpen: boolean;
  questionToDelete: string | null;
  setSelectedQuestionIndex: (index: number | null) => void;
  setActiveTab: (tab: string) => void;
  setAnalyticsMode: (mode: 'basic' | 'advanced') => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setQuestionToDelete: (id: string | null) => void;
  openQuestion: (index: number) => void;
  closeQuestion: () => void;
  handleDeleteQuestion: (questionId: string) => void;
  resetUIState: () => void;
}

export function useQAUIState(): QAUIState {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [analyticsMode, setAnalyticsMode] = useState<'basic' | 'advanced'>('basic');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const openQuestion = useCallback((index: number) => {
    setSelectedQuestionIndex(index);
  }, []);

  const closeQuestion = useCallback(() => {
    setSelectedQuestionIndex(null);
  }, []);

  const handleDeleteQuestion = useCallback((questionId: string) => {
    setQuestionToDelete(questionId);
    setDeleteDialogOpen(true);
  }, []);

  const resetUIState = useCallback(() => {
    setSelectedQuestionIndex(null);
    setActiveTab('questions');
    setAnalyticsMode('basic');
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  }, []);

  return {
    selectedQuestionIndex,
    activeTab,
    analyticsMode,
    deleteDialogOpen,
    questionToDelete,
    setSelectedQuestionIndex,
    setActiveTab,
    setAnalyticsMode,
    setDeleteDialogOpen,
    setQuestionToDelete,
    openQuestion,
    closeQuestion,
    handleDeleteQuestion,
    resetUIState,
  };
}