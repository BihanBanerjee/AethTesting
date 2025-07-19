'use client'

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuggestionColor } from './utils';
import type { CodeSuggestion } from './types';

interface SuggestionsPanelProps {
  suggestions: CodeSuggestion[];
  showSuggestions: boolean;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  suggestions,
  showSuggestions
}) => {
  return (
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-b border-white/10 bg-slate-900/50"
        >
          <div className="p-3 space-y-2">
            <h4 className="text-sm font-medium text-white/80 mb-2">Code Suggestions</h4>
            {suggestions.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 rounded text-xs ${getSuggestionColor(suggestion.severity)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Line {suggestion.line} - {suggestion.type}</span>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.severity}
                  </Badge>
                </div>
                <p className="mb-1">{suggestion.message}</p>
                <p className="font-mono text-xs opacity-80">{suggestion.suggestion}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};