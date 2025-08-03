import { useState, useCallback } from 'react';
import type { ProcessingStage } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

export interface QuestionUIState {
  open: boolean;
  showModal: boolean;
  processingStage: ProcessingStage;
  setOpen: (open: boolean) => void;
  setShowModal: (show: boolean) => void;
  setProcessingStage: (stage: ProcessingStage) => void;
  closeAllModals: () => void;
}

export function useQuestionUIState(): QuestionUIState {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('analyzing');

  const closeAllModals = useCallback(() => {
    setOpen(false);
    setShowModal(false);
    setProcessingStage('analyzing');
  }, []);

  return {
    open,
    showModal,
    processingStage,
    setOpen,
    setShowModal,
    setProcessingStage,
    closeAllModals,
  };
}