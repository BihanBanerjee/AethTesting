// src/components/code-assistant/intent-classifier-wrapper.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntentClassifier, type QueryIntent } from '@/lib/intent-classifier';

interface IntentClassifierContextType {
  classifier: IntentClassifier | null;
  classifyQuery: (query: string, context?: any) => Promise<QueryIntent>;
  isReady: boolean;
}

const IntentClassifierContext = createContext<IntentClassifierContextType>({
  classifier: null,
  classifyQuery: async () => ({ 
    type: 'question', 
    confidence: 0.5, 
    requiresCodeGen: false, 
    requiresFileModification: false, 
    contextNeeded: 'project' 
  }),
  isReady: false
});

export const useIntentClassifier = () => useContext(IntentClassifierContext);

export const IntentClassifierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classifier, setClassifier] = useState<IntentClassifier | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initClassifier = async () => {
      try {
        const newClassifier = new IntentClassifier();
        setClassifier(newClassifier);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize intent classifier:', error);
      }
    };

    initClassifier();
  }, []);

  const classifyQuery = async (query: string, context?: any): Promise<QueryIntent> => {
    if (!classifier) {
      return { 
        type: 'question', 
        confidence: 0.5, 
        requiresCodeGen: false, 
        requiresFileModification: false, 
        contextNeeded: 'project' 
      };
    }

    try {
      return await classifier.classifyQuery(query, context);
    } catch (error) {
      console.error('Intent classification failed:', error);
      return { 
        type: 'question', 
        confidence: 0.3, 
        requiresCodeGen: false, 
        requiresFileModification: false, 
        contextNeeded: 'project' 
      };
    }
  };

  return (
    <IntentClassifierContext.Provider value={{ classifier, classifyQuery, isReady }}>
      {children}
    </IntentClassifierContext.Provider>
  );
};