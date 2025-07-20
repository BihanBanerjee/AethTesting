'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SuggestionPrediction } from '../types/smart-input-suggestion.types';

interface SuggestionItemProps {
  prediction: SuggestionPrediction;
  index: number;
  onSelect: (suggestion: string) => void;
}

export const SuggestionItem: React.FC<SuggestionItemProps> = ({
  prediction,
  index,
  onSelect
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelect(prediction.suggestion)}
        className="border-white/20 bg-white/5 text-white hover:bg-white/15 text-xs h-auto py-2 px-3"
      >
        <div className="flex items-center gap-1">
          {prediction.icon}
          <span className="mr-1">{prediction.intent}</span>
          <Badge variant="outline" className="text-xs px-1 py-0 h-4">
            {Math.round(prediction.confidence * 100)}%
          </Badge>
        </div>
      </Button>
    </motion.div>
  );
};