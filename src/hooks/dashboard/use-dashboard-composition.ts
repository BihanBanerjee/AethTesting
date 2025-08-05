import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuestionInput } from './use-question-input';
import { useResponseState } from './use-response-state';
import { useQuestionUIState } from './use-question-ui-state';
import { useUnifiedFileSelection } from '../use-unified-file-selection';
import useProject from '@/hooks/use-project';
import type { QuestionState, EnhancedResponse, ActiveTab, ProcessingStage } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';
import type { QueryIntent } from '@/lib/intent-classifier';

export interface DashboardComposition {
  state: QuestionState;
  actions: {
    setOpen: (open: boolean) => void;
    setQuestion: (question: string) => void;
    setLoading: (loading: boolean) => void;
    setResponse: (response: EnhancedResponse | null) => void;
    setActiveTab: (tab: ActiveTab) => void;
    setIntentPreview: (intent: QueryIntent | null) => void;
    setProcessingStage: (stage: ProcessingStage) => void;
    setSelectedFiles: (files: string[]) => void;
    setShowModal: (show: boolean) => void;
    setStreamingContent: (content: string) => void;
    resetState: () => void;
    clearPersistedState: () => void;
  };
}

export function useDashboardComposition(): DashboardComposition {
  const { project } = useProject();
  const questionInput = useQuestionInput();
  const responseState = useResponseState() as ReturnType<typeof useResponseState> & { persistState: (question: string, selectedFiles: string[]) => void };
  const uiState = useQuestionUIState();
  const fileSelection = useUnifiedFileSelection();

  // Track project changes for cleanup
  const previousProjectIdRef = useRef<string | null>(null);

  // Clear state when project changes
  useEffect(() => {
    const currentProjectId = project?.id || null;
    const previousProjectId = previousProjectIdRef.current;

    // If project changed (and it's not the initial load)
    if (previousProjectId && previousProjectId !== currentProjectId) {
      console.log('🔄 Project changed, clearing dashboard state:', { 
        from: previousProjectId, 
        to: currentProjectId 
      });
      
      // Clear all state
      questionInput.clearQuestion();
      responseState.clearResponse();
      uiState.closeAllModals();
      fileSelection.clearSelection();
      responseState.clearPersistedState();
    }

    // Update the ref for next comparison
    previousProjectIdRef.current = currentProjectId;
  }, [project?.id, questionInput.clearQuestion, responseState.clearResponse, responseState.clearPersistedState, uiState.closeAllModals, fileSelection.clearSelection]);

  // Restore persisted state on mount (only once)
  useEffect(() => {
    const restoredData = responseState.restorePersistedState();
    if (restoredData) {
      console.log('🔄 Restoring question and file selection:', restoredData);
      questionInput.setQuestion(restoredData.question);
      fileSelection.setSelectedFiles(restoredData.selectedFiles);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseState.restorePersistedState]);

  // Persist state when response changes
  useEffect(() => {
    if (responseState.persistState) {
      responseState.persistState(questionInput.question, fileSelection.selectedFiles);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseState.response, responseState.persistState, questionInput.question, fileSelection.selectedFiles]);

  const resetState = useCallback(() => {
    questionInput.clearQuestion();
    responseState.clearResponse();
    uiState.closeAllModals();
    fileSelection.clearSelection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionInput.clearQuestion, responseState.clearResponse, uiState.closeAllModals, fileSelection.clearSelection]);

  const state: QuestionState = useMemo(() => ({
    open: uiState.open,
    question: questionInput.question,
    loading: responseState.loading,
    response: responseState.response,
    activeTab: responseState.activeTab,
    intentPreview: responseState.intentPreview,
    processingStage: uiState.processingStage,
    selectedFiles: fileSelection.selectedFiles,
    availableFiles: fileSelection.availableFiles,
    showModal: uiState.showModal,
    streamingContent: responseState.streamingContent,
  }), [
    uiState.open,
    questionInput.question,
    responseState.loading,
    responseState.response,
    responseState.activeTab,
    responseState.intentPreview,
    uiState.processingStage,
    fileSelection.selectedFiles,
    fileSelection.availableFiles,
    uiState.showModal,
    responseState.streamingContent,
  ]);

  const actions = useMemo(() => ({
    setOpen: uiState.setOpen,
    setQuestion: questionInput.setQuestion,
    setLoading: responseState.setLoading,
    setResponse: responseState.setResponse,
    setActiveTab: responseState.setActiveTab,
    setIntentPreview: responseState.setIntentPreview,
    setProcessingStage: uiState.setProcessingStage,
    setSelectedFiles: fileSelection.setSelectedFiles,
    setShowModal: uiState.setShowModal,
    setStreamingContent: responseState.setStreamingContent,
    resetState,
    clearPersistedState: responseState.clearPersistedState,
  }), [
    uiState.setOpen,
    questionInput.setQuestion,
    responseState.setLoading,
    responseState.setResponse,
    responseState.setActiveTab,
    responseState.setIntentPreview,
    uiState.setProcessingStage,
    fileSelection.setSelectedFiles,
    uiState.setShowModal,
    responseState.setStreamingContent,
    resetState,
    responseState.clearPersistedState,
  ]);

  return { state, actions };
}