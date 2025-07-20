'use client'

import React, { useState, useEffect } from 'react';
import { IntentClassifier, type QueryIntent } from '@/lib/intent-classifier';
import { toast } from 'sonner';
import { IntentClassifierContext } from '../context/intent-classifier-context';
import { createFallbackIntent } from '../utils/fallback-classifier';
import type { ProjectContext } from '../types/intent-classifier.types';

export const IntentClassifierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classifier, setClassifier] = useState<IntentClassifier | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initClassifier = async () => {
      try {
        // Check if we have the API key on the client side
        const apiKeyPresent = typeof window !== 'undefined' && 
          document.cookie.includes('gemini-api-available=true');

        setHasApiKey(apiKeyPresent);
        
        const newClassifier = new IntentClassifier();
        setClassifier(newClassifier);
        setIsReady(true);
        setError(null);
        
        if (!apiKeyPresent) {
          console.warn('Gemini API key not detected - will use fallback classification');
        }
      } catch (error) {
        console.error('Failed to initialize intent classifier:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
        // Still set as ready so fallback can work
        setIsReady(true);
      }
    };

    initClassifier();
  }, []);

  const classifyQuery = async (query: string, context?: ProjectContext): Promise<QueryIntent> => {
    if (!classifier) {
      // Return default classification if classifier not ready
      return createFallbackIntent(query);
    }

    try {
      const result = await classifier.classifyQuery(query, context);
      
      // Clear any previous errors on successful classification
      if (error && result.confidence > 0.6) {
        setError(null);
      }
      
      return result;
    } catch (error) {
      console.error('Intent classification failed:', error);
      
      // Handle specific API key errors
      if (error instanceof Error && 
          (error.message.includes('API key not valid') || 
           error.message.includes('API_KEY_INVALID'))) {
        const errorMsg = 'AI features require a valid Gemini API key. Using basic classification.';
        setError(errorMsg);
        setHasApiKey(false);
        
        // Show user-friendly message only once
        if (!sessionStorage.getItem('api-key-error-shown')) {
          toast.warning('AI features limited', {
            description: 'Some advanced features may not work without proper API configuration.',
            duration: 5000
          });
          sessionStorage.setItem('api-key-error-shown', 'true');
        }
      } else {
        setError('Classification temporarily unavailable');
      }
      
      return createFallbackIntent(query);
    }
  };

  return (
    <IntentClassifierContext.Provider value={{ 
      classifier, 
      classifyQuery, 
      isReady, 
      hasApiKey, 
      error 
    }}>
      {children}
    </IntentClassifierContext.Provider>
  );
};