'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompactQuestionDisplayProps {
  question: string;
  maxLength?: number;
  className?: string;
}

export const CompactQuestionDisplay: React.FC<CompactQuestionDisplayProps> = ({
  question,
  maxLength = 60,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isLong = question.length > maxLength;
  const displayText = isLong ? question.slice(0, maxLength) + '...' : question;

  return (
    <div className="relative flex-1 min-w-0">
      <div
        className={`text-sm text-white/60 truncate cursor-help ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {displayText}
      </div>

      <AnimatePresence>
        {showTooltip && isLong && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 z-50 max-w-md"
          >
            <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
              <div className="text-sm text-white/90 leading-relaxed">
                {question}
              </div>
              <div className="absolute -top-1 left-4 w-2 h-2 bg-black/90 border-l border-t border-white/20 transform rotate-45"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};