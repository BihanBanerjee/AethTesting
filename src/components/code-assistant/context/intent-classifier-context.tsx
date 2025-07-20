'use client'

import { createContext } from 'react';
import type { IntentClassifierContextType } from '../types/intent-classifier.types';

export const IntentClassifierContext = createContext<IntentClassifierContextType>({
  classifier: null,
  classifyQuery: async () => ({ 
    type: 'question', 
    confidence: 0.5, 
    requiresCodeGen: false, 
    requiresFileModification: false, 
    contextNeeded: 'project' 
  }),
  isReady: false,
  hasApiKey: false,
  error: null
});