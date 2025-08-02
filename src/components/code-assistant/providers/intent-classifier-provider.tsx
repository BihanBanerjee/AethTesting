'use client'

import React, { useState } from 'react';
import { type QueryIntent } from '@/lib/intent-classifier';
import { api } from '@/trpc/react';
import { IntentClassifierContext } from '../context/intent-classifier-context';
import { createFallbackIntent } from '../utils/fallback-classifier';
import type { ProjectContext } from '../types/intent-classifier.types';

export const IntentClassifierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady] = useState(true); // Always ready since we use tRPC
  const [error, setError] = useState<string | null>(null);

  // Use the proper tRPC route for intent classification
  const classifyIntentMutation = api.project.classifyIntent.useMutation();

  const classifyQuery = async (query: string, context?: ProjectContext): Promise<QueryIntent> => {
    // WARNING: This function makes SERVER-SIDE API calls and should ONLY be used for:
    // 1. Actual message sending (not input suggestions)
    // 2. Real user interactions requiring AI classification
    // For input suggestions, use createFallbackIntent() directly to avoid billing costs!
    
    if (!context?.projectId) {
      // Return fallback classification if no project context
      return createFallbackIntent(query);
    }

    try {
      const result = await classifyIntentMutation.mutateAsync({
        projectId: context.projectId,
        query,
      });
      
      // Clear any previous errors on successful classification
      if (error) {
        setError(null);
      }
      
      return result.intent;
    } catch (error) {
      console.error('Intent classification failed:', error);
      setError('Classification temporarily unavailable');
      
      // Return fallback classification on error
      return createFallbackIntent(query);
    }
  };

  return (
    <IntentClassifierContext.Provider value={{ 
      classifier: null, // No longer needed since we use tRPC
      classifyQuery, 
      isReady,
      hasApiKey: true, // Always true since API key is server-side only
      error 
    }}>
      {children}
    </IntentClassifierContext.Provider>
  );
};