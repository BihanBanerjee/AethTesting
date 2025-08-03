import { useState, useCallback } from 'react';

export interface QAFilters {
  intent: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain' | undefined;
  timeRange: 'day' | 'week' | 'month' | 'all';
  sortBy: 'createdAt' | 'satisfaction' | 'confidence';
  sortOrder: 'asc' | 'desc';
}

export interface QAFiltersState {
  filters: QAFilters;
  setFilters: (filters: Partial<QAFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: QAFilters = {
  intent: undefined,
  timeRange: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

export function useQAFilters(): QAFiltersState {
  const [filters, setFiltersState] = useState<QAFilters>(defaultFilters);

  const setFilters = useCallback((newFilters: Partial<QAFilters>) => {
    setFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  return {
    filters,
    setFilters,
    resetFilters,
  };
}