'use client'

import { useState, useEffect } from 'react';
import { useIntentClassifier } from '../intent-classifier-wrapper';
import { generateSuggestions } from '../utils/suggestion-generator';
import type { SuggestionPrediction, ProjectContext } from '../types/smart-input-suggestion.types';

export function useInputAnalysis(currentInput: string, projectContext?: ProjectContext) {
  const { classifyQuery, isReady } = useIntentClassifier();
  const [predictions, setPredictions] = useState<SuggestionPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!currentInput.trim() || currentInput.length < 10 || !isReady) {
      setPredictions([]);
      return;
    }

    const analyzeInput = async () => {
      setIsAnalyzing(true);
      try {
        const intent = await classifyQuery(currentInput, projectContext);
        
        // Generate contextual suggestions based on intent
        const suggestions = generateSuggestions(currentInput, intent, projectContext);
        setPredictions(suggestions);
      } catch (error) {
        console.error('Failed to analyze input:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const debounceTimer = setTimeout(analyzeInput, 800);
    return () => clearTimeout(debounceTimer);
  }, [currentInput, classifyQuery, isReady, projectContext]);

  return { predictions, isAnalyzing };
}