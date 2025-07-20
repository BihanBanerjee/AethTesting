'use client'

import { useState, useEffect } from 'react';
import { useIntentClassifier } from '../../intent-classifier-wrapper';
import { getFilesForIntent } from '../utils/intent-file-mapping';
import type { IntentClassificationResult, IntentType } from '../types';

export const useFileSuggestions = (
  currentQuery: string | undefined,
  availableFiles: string[]
) => {
  const { classifyQuery, isReady } = useIntentClassifier();
  const [suggestedFiles, setSuggestedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentQuery || !isReady) {
      setSuggestedFiles([]);
      return;
    }

    const suggestRelevantFiles = async () => {
      setIsLoading(true);
      try {
        const intent: IntentClassificationResult = await classifyQuery(currentQuery, { availableFiles });
        
        // Use the IntentClassifier's file reference extraction
        const relevantFiles = intent.targetFiles || [];
        
        // Add additional heuristics based on intent type
        const intentType = intent.type as IntentType;
        const additionalFiles = getFilesForIntent(intentType, availableFiles, currentQuery);
        
        const allSuggested = [...new Set([...relevantFiles, ...additionalFiles])];
        setSuggestedFiles(allSuggested.slice(0, 5));
      } catch (error) {
        console.error('Failed to suggest files:', error);
        setSuggestedFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    suggestRelevantFiles();
  }, [currentQuery, classifyQuery, isReady, availableFiles]);

  return {
    suggestedFiles,
    isLoading,
    isReady
  };
};