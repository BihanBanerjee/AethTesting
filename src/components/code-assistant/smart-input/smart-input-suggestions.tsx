'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useInputAnalysis } from '../hooks/use-input-analysis';
import { SuggestionItem } from '../components/suggestion-item';
import type { SmartInputSuggestionsProps } from '../types/smart-input-suggestion.types';

export const SmartInputSuggestions: React.FC<SmartInputSuggestionsProps> = ({
  currentInput,
  onSuggestionSelect,
  projectContext
}) => {
  const { predictions, isAnalyzing } = useInputAnalysis(currentInput);

  if (predictions.length === 0 || isAnalyzing) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-3"
      >
        <div className="text-xs text-white/60 mb-2 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Smart Suggestions
        </div>
        <div className="flex flex-wrap gap-2">
          {predictions.map((prediction, index) => (
            <SuggestionItem
              key={index}
              prediction={prediction}
              index={index}
              onSelect={onSuggestionSelect}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};