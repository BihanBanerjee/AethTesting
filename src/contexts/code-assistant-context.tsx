'use client'

import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useCodeAssistantComposition } from '@/hooks/code-assistant';
import type { CodeAssistantComposition } from '@/hooks/code-assistant';

interface CodeAssistantContextType extends CodeAssistantComposition {}

const CodeAssistantContext = createContext<CodeAssistantContextType | undefined>(undefined);

export interface CodeAssistantProviderProps {
  children: ReactNode;
}

export function CodeAssistantProvider({ children }: CodeAssistantProviderProps) {
  const codeAssistantState = useCodeAssistantComposition();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => codeAssistantState, [codeAssistantState]);

  return (
    <CodeAssistantContext.Provider value={contextValue}>
      {children}
    </CodeAssistantContext.Provider>
  );
}

export function useCodeAssistantContext(): CodeAssistantContextType {
  const context = useContext(CodeAssistantContext);
  if (context === undefined) {
    throw new Error('useCodeAssistantContext must be used within a CodeAssistantProvider');
  }
  return context;
}

// Helper hooks for specific state slices to prevent unnecessary re-renders
export function useCodeAssistantMessages() {
  const { messages, input, setInput, isLoading, messagesEndRef, textareaRef } = useCodeAssistantContext();
  return { messages, input, setInput, isLoading, messagesEndRef, textareaRef };
}

export function useCodeAssistantFiles() {
  const { selectedFiles, setSelectedFiles, availableFiles } = useCodeAssistantContext();
  return { selectedFiles, setSelectedFiles, availableFiles };
}

export function useCodeAssistantProcessing() {
  const { currentIntent, processingStage, progress } = useCodeAssistantContext();
  return { currentIntent, processingStage, progress };
}

export function useCodeAssistantActions() {
  const { 
    handleSendMessage, 
    handleKeyPress, 
    routeIntentToAPI, 
    resetAll, 
    exportConversation 
  } = useCodeAssistantContext();
  
  return { 
    handleSendMessage, 
    handleKeyPress, 
    routeIntentToAPI, 
    resetAll, 
    exportConversation 
  };
}

export function useCodeAssistantUI() {
  const { activeTab, setActiveTab } = useCodeAssistantContext();
  return { activeTab, setActiveTab };
}