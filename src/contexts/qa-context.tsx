'use client'

import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQAComposition } from '@/hooks/qa';
import type { QAComposition } from '@/hooks/qa';


const QAContext = createContext<QAComposition | undefined>(undefined);

export interface QAProviderProps {
  children: ReactNode;
}

export function QAProvider({ children }: QAProviderProps) {
  const qaState = useQAComposition();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => qaState, [qaState]);

  return (
    <QAContext.Provider value={contextValue}>
      {children}
    </QAContext.Provider>
  );
}

export function useQAContext(): QAComposition {
  const context = useContext(QAContext);
  if (context === undefined) {
    throw new Error('useQAContext must be used within a QAProvider');
  }
  return context;
}

// Helper hooks for specific state slices
export function useQAData() {
  const { questions, statistics, isLoading, selectedQuestion } = useQAContext();
  return { questions, statistics, isLoading, selectedQuestion };
}

export function useQAFilters() {
  const { filters, handleFilterChange, resetFilters } = useQAContext();
  return { filters, handleFilterChange, resetFilters };
}

export function useQAUI() {
  const { 
    selectedQuestionIndex, 
    activeTab, 
    analyticsMode, 
    deleteDialogOpen, 
    questionToDelete,
    setActiveTab,
    setAnalyticsMode 
  } = useQAContext();
  
  return { 
    selectedQuestionIndex, 
    activeTab, 
    analyticsMode, 
    deleteDialogOpen, 
    questionToDelete,
    setActiveTab,
    setAnalyticsMode 
  };
}

export function useQAActions() {
  const { 
    openQuestion, 
    closeQuestion, 
    handleDeleteQuestion, 
    confirmDelete, 
    cancelDelete, 
    refetch, 
    resetAll 
  } = useQAContext();
  
  return { 
    openQuestion, 
    closeQuestion, 
    handleDeleteQuestion, 
    confirmDelete, 
    cancelDelete, 
    refetch, 
    resetAll 
  };
}