// src/app/(protected)/dashboard/ask-question-card/hooks/use-question-state.ts
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import type { QuestionState, EnhancedResponse, ActiveTab, ProcessingStage } from '../types/enhanced-response';
import type { QueryIntent } from '@/lib/intent-classifier';

interface PersistedResponseState {
  question: string;
  response: EnhancedResponse | null;
  activeTab: ActiveTab;
  intentPreview: QueryIntent | null;
  selectedFiles: string[];
}

// Simple localStorage persistence functions
const saveToLocalStorage = (key: string, value: PersistedResponseState | null) => {
  try {
    if (typeof window !== 'undefined') {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string): PersistedResponseState | null => {
  try {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
};

export function useQuestionState() {
  const { user, isLoaded } = useUser();
  
  // Wait for Clerk to load before creating storage key
  const storageKey = useMemo(() => 
    isLoaded && user?.id ? `Aetheria-askResponse-${user.id}` : null, 
    [isLoaded, user?.id]
  );
  
  // Debug logging - removed to prevent unnecessary re-renders
  
  // Flag to prevent infinite loop between restore and persist
  const [isRestoring, setIsRestoring] = useState(false);
  const hasRestoredRef = useRef(false);
  
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<EnhancedResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('response');
  const [intentPreview, setIntentPreview] = useState<QueryIntent | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('analyzing');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Memoize setter functions to prevent unnecessary re-renders
  const setters = useMemo(() => ({
    setOpen,
    setQuestion,
    setLoading,
    setResponse,
    setActiveTab,
    setIntentPreview,
    setProcessingStage,
    setSelectedFiles,
    setAvailableFiles,
    setShowModal,
    setStreamingContent,
  }), []);

  // Restore state directly from localStorage when storage key is ready (only once)
  useEffect(() => {
    if (storageKey && !hasRestoredRef.current) {
      console.log('🔄 Restoration check - loading from localStorage:', { storageKey });
      
      const persistedData = loadFromLocalStorage(storageKey);
      
      if (persistedData) {
        console.log('✅ Restoring state:', persistedData);
        setIsRestoring(true);
        setQuestion(persistedData.question || '');
        setResponse(persistedData.response || null);
        setActiveTab(persistedData.activeTab || 'response');
        setIntentPreview(persistedData.intentPreview || null);
        setSelectedFiles(persistedData.selectedFiles || []);
        setIsRestoring(false);
      } else {
        console.log('❌ No persisted state found');
      }
      hasRestoredRef.current = true;
    }
  }, [storageKey]);

  // Function to clear persisted state (when answer is saved or manually cleared)
  const clearPersistedState = useCallback(() => {
    if (storageKey) {
      saveToLocalStorage(storageKey, null);
    }
  }, [storageKey]);

  // Persist state only when response changes - use refs to avoid dependency issues
  const lastResponseRef = useRef<EnhancedResponse | null>(null);
  const stateRef = useRef({ question, activeTab, intentPreview, selectedFiles });
  
  // Update state ref on every render
  stateRef.current = { question, activeTab, intentPreview, selectedFiles };
  
  useEffect(() => {
    if (response !== lastResponseRef.current && storageKey && !isRestoring && hasRestoredRef.current) {
      const stateToSave: PersistedResponseState = {
        question: stateRef.current.question,
        response,
        activeTab: stateRef.current.activeTab,
        intentPreview: stateRef.current.intentPreview,
        selectedFiles: stateRef.current.selectedFiles,
      };
      console.log('💾 Persisting state (response changed):', stateToSave);
      saveToLocalStorage(storageKey, stateToSave);
      lastResponseRef.current = response;
    }
  }, [response, storageKey, isRestoring]);

  const resetState = useCallback(() => {
    setQuestion('');
    setLoading(false);
    setResponse(null);
    setActiveTab('response');
    setIntentPreview(null);
    setProcessingStage('analyzing');
    setSelectedFiles([]);
    setShowModal(false);
    setStreamingContent('');
    // Clear persisted state when resetting
    clearPersistedState();
    // Reset restoration flag
    hasRestoredRef.current = false;
  }, [clearPersistedState]);

  const state: QuestionState = {
    open,
    question,
    loading,
    response,
    activeTab,
    intentPreview,
    processingStage,
    selectedFiles,
    availableFiles,
    showModal,
    streamingContent,
  };

  const actions = useMemo(() => ({
    ...setters,
    resetState,
    clearPersistedState,
  }), [setters, resetState, clearPersistedState]);

  return { state, actions };
}