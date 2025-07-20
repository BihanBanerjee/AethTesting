'use client'

import { useState } from 'react';
import { toast } from 'sonner';
import useProject from '@/hooks/use-project';
import { useIntentClassifier } from '@/components/code-assistant/intent-classifier-wrapper';
import { useMessageManagement } from './use-message-management';
import { useFileSelection } from './use-file-selection';
import { useProcessingStates } from './use-processing-states';
import { useAPIRouting } from './use-api-routing';
import { extractResponseContent, extractResponseMetadata } from '../utils/response-processors';
import type { ActiveTab, IntentType, Message } from '@/types/code-assistant';
import type { CodeAssistantHookReturn } from '../types/use-code-assistant.types';

export function useCodeAssistant(): CodeAssistantHookReturn {
  const { project } = useProject();
  const { classifyQuery, isReady } = useIntentClassifier();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  
  // Use modularized hooks
  const messageState = useMessageManagement();
  const fileState = useFileSelection();
  const processingState = useProcessingStates();
  const apiRouting = useAPIRouting(
    fileState.selectedFiles,
    processingState.setProcessingStage,
    processingState.setProgress
  );

  const handleSendMessage = async () => {
    if (!messageState.input.trim() || !project || !isReady) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageState.input,
      timestamp: new Date()
    };

    messageState.setMessages((prev: Message[]) => [...prev, userMessage]);
    messageState.setIsLoading(true);
    
    try {
      // Step 1: Classify intent
      processingState.setProcessingStage('analyzing');
      processingState.setProgress(10);
      
      const intent = await classifyQuery(messageState.input, { 
        availableFiles: fileState.availableFiles,
        selectedFiles: fileState.selectedFiles 
      });
      
      processingState.setCurrentIntent(intent.type as IntentType);
      processingState.setProgress(30);

      processingState.setProcessingStage('processing');
      processingState.setProgress(50);

      // Step 2: Route to appropriate handler based on intent
      const response = await apiRouting.routeIntentToAPI(intent, messageState.input, project.id);

      processingState.setProgress(90);
      processingState.setProcessingStage('complete');
      processingState.setProgress(100);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: extractResponseContent(response),
        intent: intent.type,
        confidence: intent.confidence,
        metadata: extractResponseMetadata(response, intent),
        timestamp: new Date()
      };

      messageState.setMessages((prev: Message[]) => [...prev, assistantMessage]);
      setActiveTab('chat');
      
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process your request. Please try again.');
      
      processingState.setProcessingStage('error');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I encountered an error processing your request. Please try rephrasing your question or check if the project is properly loaded.',
        intent: processingState.currentIntent,
        timestamp: new Date()
      };
      
      messageState.setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      messageState.setIsLoading(false);
      messageState.setInput('');
      setTimeout(() => {
        processingState.setProcessingStage('complete');
        processingState.setProgress(0);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return {
    // Message state
    messages: messageState.messages,
    input: messageState.input,
    setInput: messageState.setInput,
    isLoading: messageState.isLoading,
    messagesEndRef: messageState.messagesEndRef,
    textareaRef: messageState.textareaRef,
    
    // File state
    selectedFiles: fileState.selectedFiles,
    setSelectedFiles: fileState.setSelectedFiles,
    availableFiles: fileState.availableFiles,
    
    // Processing state
    currentIntent: processingState.currentIntent,
    processingStage: processingState.processingStage,
    progress: processingState.progress,
    
    // API routing
    routeIntentToAPI: apiRouting.routeIntentToAPI,
    
    // UI state
    activeTab,
    setActiveTab,
    
    // Handlers
    handleSendMessage,
    handleKeyPress,
    
    // Project context
    project,
    projectContext: {
      availableFiles: fileState.availableFiles,
      techStack: ['React', 'TypeScript', 'Next.js'],
      recentQueries: []
    }
  };
}