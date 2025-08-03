import { useState, useCallback, useRef, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import type { EnhancedResponse, ActiveTab } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';
import type { QueryIntent } from '@/lib/intent-classifier';

interface PersistedResponseState {
  question: string;
  response: EnhancedResponse | null;
  activeTab: ActiveTab;
  intentPreview: QueryIntent | null;
  selectedFiles: string[];
}

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

export interface ResponseState {
  response: EnhancedResponse | null;
  loading: boolean;
  activeTab: ActiveTab;
  intentPreview: QueryIntent | null;
  streamingContent: string;
  setResponse: (response: EnhancedResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setIntentPreview: (intent: QueryIntent | null) => void;
  setStreamingContent: (content: string) => void;
  clearResponse: () => void;
  clearPersistedState: () => void;
  restorePersistedState: (question: string, selectedFiles: string[]) => boolean;
}

export function useResponseState(): ResponseState {
  const { user, isLoaded } = useUser();
  
  const storageKey = useMemo(() => 
    isLoaded && user?.id ? `Aetheria-askResponse-${user.id}` : null, 
    [isLoaded, user?.id]
  );
  
  const [isRestoring, setIsRestoring] = useState(false);
  const hasRestoredRef = useRef(false);
  
  const [response, setResponse] = useState<EnhancedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('response');
  const [intentPreview, setIntentPreview] = useState<QueryIntent | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  const clearPersistedState = useCallback(() => {
    if (storageKey) {
      saveToLocalStorage(storageKey, null);
    }
  }, [storageKey]);

  const restorePersistedState = useCallback((): boolean => {
    if (storageKey && !hasRestoredRef.current) {
      console.log('🔄 Restoration check - loading from localStorage:', { storageKey });
      
      const persistedData = loadFromLocalStorage(storageKey);
      
      if (persistedData) {
        console.log('✅ Restoring state:', persistedData);
        setIsRestoring(true);
        setResponse(persistedData.response || null);
        setActiveTab(persistedData.activeTab || 'response');
        setIntentPreview(persistedData.intentPreview || null);
        setIsRestoring(false);
        hasRestoredRef.current = true;
        return true;
      } else {
        console.log('❌ No persisted state found');
      }
      hasRestoredRef.current = true;
    }
    return false;
  }, [storageKey]);

  const lastResponseRef = useRef<EnhancedResponse | null>(null);
  
  const persistState = useCallback((question: string, selectedFiles: string[]) => {
    if (response !== lastResponseRef.current && storageKey && !isRestoring && hasRestoredRef.current) {
      const stateToSave: PersistedResponseState = {
        question,
        response,
        activeTab,
        intentPreview,
        selectedFiles,
      };
      console.log('💾 Persisting state (response changed):', stateToSave);
      saveToLocalStorage(storageKey, stateToSave);
      lastResponseRef.current = response;
    }
  }, [response, activeTab, intentPreview, storageKey, isRestoring]);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setLoading(false);
    setActiveTab('response');
    setIntentPreview(null);
    setStreamingContent('');
    clearPersistedState();
    hasRestoredRef.current = false;
  }, [clearPersistedState]);

  return {
    response,
    loading,
    activeTab,
    intentPreview,
    streamingContent,
    setResponse,
    setLoading,
    setActiveTab,
    setIntentPreview,
    setStreamingContent,
    clearResponse,
    clearPersistedState,
    restorePersistedState,
    // Internal method for persistence - to be called by parent component
    persistState,
  } as ResponseState & { persistState: (question: string, selectedFiles: string[]) => void };
}