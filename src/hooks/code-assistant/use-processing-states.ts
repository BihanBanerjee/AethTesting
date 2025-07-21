'use client'

import { useState } from 'react';
import type { ProcessingStage, IntentType } from '@/components/code-assistant/types';
import type { ProcessingState } from '../types/use-code-assistant.types';

export function useProcessingStates(): ProcessingState {
  const [currentIntent, setCurrentIntent] = useState<IntentType | undefined>(undefined);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('complete');
  const [progress, setProgress] = useState(0);

  return {
    currentIntent,
    processingStage,
    progress,
    setCurrentIntent,
    setProcessingStage,
    setProgress
  };
}