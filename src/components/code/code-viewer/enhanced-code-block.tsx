'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCodeActions } from './hooks';
import { CodeBlockHeader } from './code-block-header';
import { SuggestionsPanel } from './suggestions-panel';
import { CodeContent } from './code-content';
import type { CodeBlockProps } from './types';


export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className = '',
  diff,
  actions = { copy: true, download: true, run: false, apply: false, preview: false },
  onApply,
  onPreview,
  suggestions = []
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const {
    copied,
    isApplying,
    handleCopy,
    handleDownload,
    handleApply,
    handleRun
  } = useCodeActions(code, language, filename);


  return (
    <motion.div 
      className={`rounded-lg overflow-hidden border border-white/20 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CodeBlockHeader
        filename={filename}
        language={language}
        diff={diff}
        highlightLines={highlightLines}
        suggestions={suggestions}
        isExpanded={isExpanded}
        showSuggestions={showSuggestions}
        actions={actions}
        copied={copied}
        isApplying={isApplying}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        onToggleSuggestions={() => setShowSuggestions(!showSuggestions)}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onPreview={onPreview}
        onRun={handleRun}
        onApply={() => handleApply(onApply)}
      />

      <SuggestionsPanel
        suggestions={suggestions}
        showSuggestions={showSuggestions}
      />

      <CodeContent
        code={code}
        language={language}
        showLineNumbers={showLineNumbers}
        highlightLines={highlightLines}
        suggestions={suggestions}
        isExpanded={isExpanded}
      />
    </motion.div>
  );
};

