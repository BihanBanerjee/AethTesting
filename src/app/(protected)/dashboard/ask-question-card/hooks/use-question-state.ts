// src/app/(protected)/dashboard/ask-question-card/hooks/use-question-state.ts
import { useState } from 'react';
import type { QuestionState, EnhancedResponse, ActiveTab, ProcessingStage } from '../types/enhanced-response';

export function useQuestionState() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<EnhancedResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('response');
  const [intentPreview, setIntentPreview] = useState<any>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('analyzing');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const resetState = () => {
    setQuestion('');
    setLoading(false);
    setResponse(null);
    setActiveTab('response');
    setIntentPreview(null);
    setProcessingStage('analyzing');
    setSelectedFiles([]);
    setShowModal(false);
    setStreamingContent('');
  };

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

  const actions = {
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
    resetState,
  };

  return { state, actions };
}