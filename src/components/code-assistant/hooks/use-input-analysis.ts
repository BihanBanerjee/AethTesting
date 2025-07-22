'use client'

import { useState, useEffect, useRef } from 'react';
import { useIntentClassifier } from '../intent-classifier-wrapper';
import { generateSuggestions } from '../utils/suggestion-generator';
import { api } from '@/trpc/react';
import type { SuggestionPrediction, ProjectContext } from '../types/smart-input-suggestion.types';

export function useInputAnalysis(currentInput: string, projectContext?: ProjectContext) {
  const { classifyQuery: clientClassifyQuery, isReady } = useIntentClassifier();
  const [predictions, setPredictions] = useState<SuggestionPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Use refs to store stable values
  const projectIdRef = useRef(projectContext?.projectId);
  const availableFilesRef = useRef(projectContext?.availableFiles);
  
  // Update refs when values change
  useEffect(() => {
    projectIdRef.current = projectContext?.projectId;
    availableFilesRef.current = projectContext?.availableFiles;
  }, [projectContext?.projectId, projectContext?.availableFiles]);

  useEffect(() => {
    if (!currentInput.trim() || currentInput.length < 10) {
      setPredictions([]);
      return;
    }

    // For input analysis suggestions, just disable if no proper setup
    // The real classification will happen on question submission
    if (!projectIdRef.current && !isReady) {
      setPredictions([]);
      return;
    }

    const analyzeInput = async () => {
      setIsAnalyzing(true);
      try {
        // For input suggestions, only use client-side classification to avoid complexity
        // Server-side classification will be used for actual question submission
        const intent = await clientClassifyQuery(currentInput, projectContext);
        
        // Generate contextual suggestions based on intent
        const suggestions = generateSuggestions(currentInput, intent, projectContext);
        setPredictions(suggestions);
      } catch (error) {
        console.error('Failed to analyze input:', error);
        // Clear predictions on error
        setPredictions([]);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const debounceTimer = setTimeout(analyzeInput, 800);
    return () => clearTimeout(debounceTimer);
  }, [currentInput, clientClassifyQuery, isReady]); // Stable dependencies

  return { predictions, isAnalyzing };
}