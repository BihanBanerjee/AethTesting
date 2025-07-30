import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultTabs } from './result-tabs';
import type { ResultItemProps } from '../shared/types';
import { getTypeIcon, getTypeColor, getConfidenceColor } from '../shared/utils';

export const ResultItem: React.FC<ResultItemProps> = ({
  result,
  isActive,
  onToggle,
  onApplyChanges
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-b border-white/10 last:border-b-0 ${
        isActive ? 'bg-white/5' : ''
      }`}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${getTypeColor(result.type)}`}
            >
              {getTypeIcon(result.type)}
              {result.type}
            </Badge>
            <span className="text-sm font-medium text-white">
              {result.filename}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${getConfidenceColor(result.confidence)}`}
            >
              {result.confidence}% confidence
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-white/70 line-clamp-2 whitespace-pre-line">
          {result.explanation
            .replace(/\\n/g, '\n')      // Convert \n to actual newlines
            .replace(/\\r/g, '\r')      // Convert \r to carriage returns  
            .replace(/\\t/g, '\t')      // Convert \t to tabs
            .replace(/\\"/g, '"')       // Convert \" to quotes
            .replace(/\\\\/g, '\\')     // Convert \\ to single backslash
          }
        </p>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ResultTabs 
              result={result} 
              onApplyChanges={onApplyChanges} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};