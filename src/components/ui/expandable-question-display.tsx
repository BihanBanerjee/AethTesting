'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpandableQuestionDisplayProps {
  question: string;
  className?: string;
  maxLength?: number;
  showExpandButton?: boolean;
  variant?: 'modal' | 'card' | 'detail';
}

export const ExpandableQuestionDisplay: React.FC<ExpandableQuestionDisplayProps> = ({
  question,
  className,
  maxLength = 120,
  showExpandButton = true,
  variant = 'modal'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = question.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? question.slice(0, maxLength) + '...' 
    : question;

  const getVariantStyles = () => {
    switch (variant) {
      case 'modal':
        return 'text-sm text-white/60';
      case 'card':
        return 'text-base text-white';
      case 'detail':
        return 'text-lg text-white font-medium';
      default:
        return 'text-sm text-white/60';
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start gap-2">
        <motion.p
          className={cn(getVariantStyles(), 'flex-1 leading-relaxed')}
          initial={false}
          animate={{ 
            height: isExpanded ? 'auto' : 'auto',
            opacity: 1 
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          title={shouldTruncate ? question : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isExpanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {displayText}
            </motion.span>
          </AnimatePresence>
        </motion.p>

        {shouldTruncate && showExpandButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex-shrink-0 p-1 h-auto min-w-0',
              'text-white/40 hover:text-white/80 hover:bg-white/10',
              'transition-colors duration-200'
            )}
            title={isExpanded ? 'Show less' : 'Show more'}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        )}
      </div>

      {/* Word count indicator for very long questions */}
      {shouldTruncate && (
        <div className="text-xs text-white/40">
          {isExpanded ? question.length : maxLength} of {question.length} characters
          {isExpanded && (
            <span className="ml-2 text-white/30">
              ({Math.ceil(question.split(' ').length * 0.2)} seconds read)
            </span>
          )}
        </div>
      )}
    </div>
  );
};