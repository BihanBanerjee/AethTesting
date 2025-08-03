import { useMemo, useCallback } from 'react';
import { useCodeAssistant } from './use-code-assistant';
import { useCodeGeneration } from './use-code-generation';
import type { CodeAssistantHookReturn } from '../types/use-code-assistant.types';
import type { CodeGenerationHook, GenerationRequest } from './use-code-generation';

export interface EnhancedCodeAssistantComposition extends CodeAssistantHookReturn {
  // Code generation integration
  codeGeneration: CodeGenerationHook;
  
  // Unified actions
  processRequest: (input: string, intent?: 'chat' | 'generation') => Promise<void>;
  resetAll: () => void;
  exportConversation: () => void;
}

export interface CodeAssistantComposition extends EnhancedCodeAssistantComposition {
  // Maintain backward compatibility
}

export function useCodeAssistantComposition(): CodeAssistantComposition {
  const codeAssistant = useCodeAssistant();
  const codeGeneration = useCodeGeneration(codeAssistant.project?.id || '');

  // Unified request processor
  const processRequest = useCallback(async (input: string, intent: 'chat' | 'generation' = 'chat'): Promise<void> => {
    if (intent === 'generation') {
      // Use code generation flow
      const request: GenerationRequest = {
        type: 'improvement',
        prompt: input,
        context: codeAssistant.selectedFiles,
        language: 'typescript', // Default to TypeScript
        framework: 'react'
      };
      
      await codeGeneration.generateCode(request);
    } else {
      // Use existing chat flow - need to set input first
      codeAssistant.setInput(input);
      await codeAssistant.handleSendMessage();
    }
  }, [codeGeneration.generateCode, codeAssistant.handleSendMessage, codeAssistant.selectedFiles, codeAssistant.setInput]);

  // Enhanced reset that includes code generation
  const resetAll = useCallback(() => {
    // Reset code generation state
    codeGeneration.clearResults();
    
    // Reset chat messages (if we had access to the setter)
    console.log('Resetting all code assistant state');
    
    // Note: We could extend useCodeAssistant to expose message reset functionality
    // For now, this provides the hook for future enhancement
  }, [codeGeneration.clearResults]);

  const exportConversation = useCallback(() => {
    // Enhanced export including code generation results
    const conversation = {
      messages: codeAssistant.messages,
      selectedFiles: codeAssistant.selectedFiles,
      projectContext: codeAssistant.projectContext,
      codeGenerationResults: codeGeneration.results,
      timestamp: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(conversation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `aetheria-conversation-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [codeAssistant.messages, codeAssistant.selectedFiles, codeAssistant.projectContext, codeGeneration.results]);

  return useMemo(() => ({
    // Destructure codeAssistant properties to avoid object reference dependency
    messages: codeAssistant.messages,
    input: codeAssistant.input,
    setInput: codeAssistant.setInput,
    isLoading: codeAssistant.isLoading,
    selectedFiles: codeAssistant.selectedFiles,
    setSelectedFiles: codeAssistant.setSelectedFiles,
    activeTab: codeAssistant.activeTab,
    setActiveTab: codeAssistant.setActiveTab,
    availableFiles: codeAssistant.availableFiles,
    currentIntent: codeAssistant.currentIntent,
    processingStage: codeAssistant.processingStage,
    progress: codeAssistant.progress,
    messagesEndRef: codeAssistant.messagesEndRef,
    textareaRef: codeAssistant.textareaRef,
    handleSendMessage: codeAssistant.handleSendMessage,
    handleKeyPress: codeAssistant.handleKeyPress,
    routeIntentToAPI: codeAssistant.routeIntentToAPI,
    project: codeAssistant.project,
    projectContext: codeAssistant.projectContext,
    
    // Code generation integration (stable references)
    codeGeneration: {
      isGenerating: codeGeneration.isGenerating,
      results: codeGeneration.results,
      activeResult: codeGeneration.activeResult,
      error: codeGeneration.error,
      generateCode: codeGeneration.generateCode,
      setActiveResult: codeGeneration.setActiveResult,
      clearResults: codeGeneration.clearResults,
      applyChanges: codeGeneration.applyChanges,
    },
    
    // Enhanced actions
    processRequest,
    resetAll,
    exportConversation,
  }), [
    // Individual properties instead of object references
    codeAssistant.messages,
    codeAssistant.input,
    codeAssistant.setInput,
    codeAssistant.isLoading,
    codeAssistant.selectedFiles,
    codeAssistant.setSelectedFiles,
    codeAssistant.activeTab,
    codeAssistant.setActiveTab,
    codeAssistant.availableFiles,
    codeAssistant.currentIntent,
    codeAssistant.processingStage,
    codeAssistant.progress,
    // Removed refs: messagesEndRef, textareaRef (cause unnecessary re-renders)
    codeAssistant.handleSendMessage,
    codeAssistant.handleKeyPress,
    codeAssistant.routeIntentToAPI,
    codeAssistant.project,
    codeAssistant.projectContext,
    
    // Code generation individual properties
    codeGeneration.isGenerating,
    codeGeneration.results,
    codeGeneration.activeResult,
    codeGeneration.error,
    codeGeneration.generateCode,
    codeGeneration.setActiveResult,
    codeGeneration.clearResults,
    codeGeneration.applyChanges,
    
    // Enhanced actions
    processRequest,
    resetAll,
    exportConversation,
  ]);
}