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
import { throttledRequest } from '../utils/request-throttle';
import { api } from '@/trpc/react';
import type { ActiveTab, IntentType, Message } from '@/components/code-assistant/types';
import type { CodeAssistantHookReturn } from '../types/use-code-assistant.types';

export function useCodeAssistant(): CodeAssistantHookReturn {
  const { project } = useProject();
  const { classifyQuery: clientClassifyQuery, isReady } = useIntentClassifier();
  
  // Server-side classification
  const serverClassifyMutation = api.project.classifyIntent.useMutation();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  
  // Use modularized hooks
  const messageState = useMessageManagement();
  const fileState = useFileSelection();
  const processingState = useProcessingStates();
  const apiRouting = useAPIRouting(
    fileState.selectedFiles
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
      // Step 1: Classify intent using dedicated tRPC route for accuracy
      processingState.setProcessingStage('analyzing');
      processingState.setProgress(10);
      
      let intent;
      try {
        // Use dedicated tRPC route for accurate intent classification
        console.log('🎯 Using dedicated tRPC route for intent classification');
        const classificationResult = await throttledRequest(
          () => serverClassifyMutation.mutateAsync({
            projectId: project.id,
            query: messageState.input,
            contextFiles: fileState.availableFiles
          }),
          'intent classification'
        );
        intent = classificationResult.intent;
        console.log('✅ Server-side classification successful:', intent.type);
      } catch (error) {
        // Fallback to client-side classification only if server fails
        console.warn('⚠️ Server classification failed, using fallback:', error);
        intent = await clientClassifyQuery(messageState.input, { 
          availableFiles: fileState.availableFiles,
          selectedFiles: fileState.selectedFiles 
        });
        console.log('🔄 Fallback classification used:', intent.type);
      }
      
      processingState.setCurrentIntent(intent.type as IntentType);
      processingState.setProgress(30);

      processingState.setProcessingStage('processing');
      processingState.setProgress(50);

      // Step 2: Route to appropriate handler based on intent (with throttling)
      const response = await throttledRequest(
        () => apiRouting.routeIntentToAPI(intent, messageState.input, project.id),
        `${intent.type} request`
      );

      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response answer:', (response as any).answer);
      console.log('Response answer type:', typeof (response as any).answer);
      
      processingState.setProgress(90);
      processingState.setProcessingStage('complete');
      processingState.setProgress(100);

      const extractedContent = extractResponseContent(response);
      console.log('🔍 FRONTEND: Extracted content:', extractedContent);
      console.log('🔍 FRONTEND: Extracted content type:', typeof extractedContent);
      console.log('🔍 FRONTEND: Extracted content length:', typeof extractedContent === 'string' ? extractedContent.length : 'Not string');
      
      // Debug: Log raw response structure
      console.log('🔍 FRONTEND: Raw response structure:', {
        hasContent: 'content' in (response || {}),
        hasFiles: 'files' in (response || {}),
        filesCount: (response as any)?.files?.length || 0,
        hasGeneratedCode: 'generatedCode' in (response || {}),
        generatedCodeLength: (response as any)?.generatedCode?.length || 0,
        intent: (response as any)?.intent
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: extractedContent,
        intent: intent.type,
        confidence: intent.confidence,
        metadata: extractResponseMetadata(response, intent),
        timestamp: new Date()
      };
      
      console.log('🔍 FRONTEND: Assistant message being added:', {
        id: assistantMessage.id,
        contentType: typeof assistantMessage.content,
        contentLength: typeof assistantMessage.content === 'string' ? assistantMessage.content.length : 'Not string',
        hasMetadata: !!assistantMessage.metadata,
        metadataGeneratedCodeLength: assistantMessage.metadata?.generatedCode?.length || 0,
        metadataLanguage: assistantMessage.metadata?.language,
        metadataFilesCount: assistantMessage.metadata?.files?.length || 0
      });

      messageState.setMessages((prev: Message[]) => [...prev, assistantMessage]);
      setActiveTab('chat');
      
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Enhanced error handling for different response types
      let errorMessage = 'I encountered an error processing your request. Please try rephrasing your question or check if the project is properly loaded.';
      
      // Provide more specific error messages based on intent type
      if (processingState.currentIntent) {
        switch (processingState.currentIntent) {
          case 'code_generation':
            errorMessage = 'Failed to generate code. Please check your requirements and try again.';
            break;
          case 'code_improvement':
            errorMessage = 'Failed to improve the code. Please select valid files and try again.';
            break;
          case 'code_review':
            errorMessage = 'Failed to review the code. Please ensure the files are accessible and try again.';
            break;
          case 'debug':
            errorMessage = 'Failed to debug the issue. Please provide more details about the error and try again.';
            break;
          case 'refactor':
            errorMessage = 'Failed to refactor the code. Please select valid files and specify clear refactoring goals.';
            break;
          case 'explain':
            errorMessage = 'Failed to explain the code. Please select valid files and try again.';
            break;
        }
      }
      
      toast.error(error instanceof Error ? error.message : 'Failed to process your request. Please try again.');
      
      const assistantErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorMessage,
        intent: processingState.currentIntent,
        timestamp: new Date()
      };
      
      messageState.setMessages((prev: Message[]) => [...prev, assistantErrorMessage]);
      processingState.setProcessingStage('error');
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
      projectId: project?.id,
      availableFiles: fileState.availableFiles,
      techStack: ['React', 'TypeScript', 'Next.js'],
      recentQueries: []
    }
  };
}