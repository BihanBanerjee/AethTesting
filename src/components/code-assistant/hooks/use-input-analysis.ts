'use client'

import { useState, useEffect, useRef } from 'react';
import { generateSuggestions } from '../utils/suggestion-generator';
import { createFallbackIntent } from '../utils/fallback-classifier';
import type { SuggestionPrediction, ProjectContext } from '../types/smart-input-suggestion.types';

export function useInputAnalysis(currentInput: string, projectContext?: ProjectContext) {
  const [predictions, setPredictions] = useState<SuggestionPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!currentInput.trim() || currentInput.length < 10) {
      setPredictions([]);
      return;
    }

    const analyzeInput = async () => {
      setIsAnalyzing(true);
      try {
        // IMPORTANT: Use ONLY fallback classification for input suggestions
        // This prevents unnecessary API calls and billing costs
        // Server-side classification is reserved for actual message sending
        const intent = createFallbackIntent(currentInput);
        
        // Generate contextual suggestions based on fallback intent
        const suggestions = generateSuggestions(currentInput, intent, projectContext);
        setPredictions(suggestions);
      } catch (error) {
        console.error('Failed to analyze input:', error);
        setPredictions([]);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Reduced debounce time since we're not making API calls
    const debounceTimer = setTimeout(analyzeInput, 300);
    return () => clearTimeout(debounceTimer);
  }, [currentInput]); // Only currentInput as dependency

  return { predictions, isAnalyzing };
}