'use client'

import { useState, useEffect } from 'react';
import type { SuggestionPrediction } from '../types/smart-input-suggestion.types';

export function useInputAnalysis(currentInput: string) {
  const [predictions, setPredictions] = useState<SuggestionPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // No real-time analysis to prevent API overload
    // Classification will only happen when user sends the message
    setPredictions([]);
    setIsAnalyzing(false);
  }, [currentInput]);

  return { predictions, isAnalyzing };
}