'use client'

import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useDashboardComposition } from '@/hooks/dashboard';
import type { DashboardComposition } from '@/hooks/dashboard';

interface DashboardContextType extends DashboardComposition {}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const dashboardState = useDashboardComposition();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => dashboardState, [dashboardState]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}

// Helper hook for specific state slices to prevent unnecessary re-renders
export function useDashboardState() {
  const { state } = useDashboardContext();
  return state;
}

export function useDashboardActions() {
  const { actions } = useDashboardContext();
  return actions;
}