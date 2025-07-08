// src/components/code-assistant/intent-classifier-wrapper.tsx - FIXED VERSION
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntentClassifier, type QueryIntent } from '@/lib/intent-classifier';
import { toast } from 'sonner';

interface IntentClassifierContextType {
  classifier: IntentClassifier | null;
  classifyQuery: (query: string, context?: any) => Promise<QueryIntent>;
  isReady: boolean;
  hasApiKey: boolean;
  error: string | null;
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
  isReady: false,
  hasApiKey: false,
  error: null
});

export const useIntentClassifier = () => useContext(IntentClassifierContext);

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

  const classifyQuery = async (query: string, context?: any): Promise<QueryIntent> => {
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
      
      // FIXED: Use our own fallback instead of trying to access private method
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

// SOLUTION: Create our own fallback function instead of accessing private method
function createFallbackIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();
  
  console.log('🎯 Using wrapper fallback classification for:', query.substring(0, 30) + '...');
  
  // Code generation patterns
  if (matchesPatterns(lowerQuery, [
    'create', 'generate', 'write', 'build', 'implement', 'add new',
    'make a', 'develop', 'code for', 'function that', 'component that'
  ])) {
    return {
      type: 'code_generation',
      confidence: 0.8,
      requiresCodeGen: true,
      requiresFileModification: true,
      contextNeeded: 'project',
      targetFiles: []
    };
  }

  // Code improvement patterns
  if (matchesPatterns(lowerQuery, [
    'improve', 'optimize', 'enhance', 'better', 'performance',
    'make faster', 'more efficient', 'cleaner', 'simplify'
  ])) {
    return {
      type: 'code_improvement',
      confidence: 0.8,
      requiresCodeGen: true,
      requiresFileModification: true,
      contextNeeded: 'file',
      targetFiles: []
    };
  }

  // Refactor patterns
  if (matchesPatterns(lowerQuery, [
    'refactor', 'restructure', 'reorganize', 'move', 'extract',
    'rename', 'split', 'combine', 'merge'
  ])) {
    return {
      type: 'refactor',
      confidence: 0.8,
      requiresCodeGen: true,
      requiresFileModification: true,
      contextNeeded: 'function',
      targetFiles: []
    };
  }

  // Debug patterns
  if (matchesPatterns(lowerQuery, [
    'bug', 'error', 'fix', 'issue', 'problem', 'not working',
    'broken', 'debug', 'troubleshoot'
  ])) {
    return {
      type: 'debug',
      confidence: 0.9,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'file',
      targetFiles: []
    };
  }

  // Review patterns
  if (matchesPatterns(lowerQuery, [
    'review', 'check', 'validate', 'audit', 'security',
    'best practices', 'code quality'
  ])) {
    return {
      type: 'code_review',
      confidence: 0.8,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'file',
      targetFiles: []
    };
  }

  // Explain patterns
  if (matchesPatterns(lowerQuery, [
    'explain', 'how does', 'what is', 'understand', 'clarify',
    'walk through', 'breakdown'
  ])) {
    return {
      type: 'explain',
      confidence: 0.9,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'function',
      targetFiles: []
    };
  }

  // Default to question
  return {
    type: 'question',
    confidence: 0.7,
    requiresCodeGen: false,
    requiresFileModification: false,
    contextNeeded: 'project',
    targetFiles: []
  };
}

// Helper function for pattern matching
function matchesPatterns(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => text.includes(pattern));
}