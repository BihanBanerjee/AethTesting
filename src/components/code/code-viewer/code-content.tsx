'use client'

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { motion, AnimatePresence } from 'framer-motion';
import { customSyntaxStyle } from './utils';
import type { CodeSuggestion } from './types';

interface CodeContentProps {
  code: string;
  language: string;
  showLineNumbers: boolean;
  highlightLines: number[];
  suggestions: CodeSuggestion[];
  isExpanded: boolean;
}

export const CodeContent: React.FC<CodeContentProps> = ({
  code,
  language,
  showLineNumbers,
  highlightLines,
  suggestions,
  isExpanded
}) => {
  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <SyntaxHighlighter
            language={language}
            style={customSyntaxStyle}
            showLineNumbers={showLineNumbers}
            lineNumberStyle={{ 
              color: 'rgba(255, 255, 255, 0.3)',
              backgroundColor: 'transparent',
              paddingRight: '1rem',
              minWidth: '2.5rem'
            }}
            wrapLines={true}
            lineProps={(lineNumber) => {
              const isHighlighted = highlightLines.includes(lineNumber);
              const suggestion = suggestions.find(s => s.line === lineNumber);
              
              return {
                style: {
                  backgroundColor: isHighlighted ? 'rgba(99, 102, 241, 0.1)' : 
                                 suggestion ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                  borderLeft: isHighlighted ? '3px solid rgba(99, 102, 241, 0.5)' : 
                             suggestion ? '3px solid rgba(234, 179, 8, 0.5)' : 'none',
                  paddingLeft: (isHighlighted || suggestion) ? '0.5rem' : '0',
                  display: 'block'
                }
              };
            }}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}
          >
            {code}
          </SyntaxHighlighter>
        </motion.div>
      )}
    </AnimatePresence>
  );
};