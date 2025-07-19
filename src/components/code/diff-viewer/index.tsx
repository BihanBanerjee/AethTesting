// src/components/code/diff-viewer/index.tsx - Modularized version
'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { DiffHeader } from './diff-header';
import { UnifiedDiffView } from './unified-diff-view';
import { SplitDiffView } from './split-diff-view';
import { generateDiff, calculateStats, generateDiffText } from './utils';
import type { DiffViewerProps } from './types';

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  filename,
  language = 'typescript',
  mode: initialMode = 'split'
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(initialMode);

  const diff = generateDiff(original, modified);
  const stats = calculateStats(diff);

  const handleCopyDiff = () => {
    const diffText = generateDiffText(diff);
    navigator.clipboard.writeText(diffText);
    toast.success('Diff copied to clipboard');
  };

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as 'split' | 'unified');
  };

  return (
    <motion.div 
      className="rounded-lg overflow-hidden border border-white/20 bg-slate-900/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DiffHeader
        filename={filename}
        language={language}
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onCopyDiff={handleCopyDiff}
      />

      <div className="max-h-96 overflow-auto">
        {viewMode === 'unified' ? (
          <UnifiedDiffView diff={diff} />
        ) : (
          <SplitDiffView original={original} modified={modified} />
        )}
      </div>
    </motion.div>
  );
};

// Re-export for backward compatibility
export default DiffViewer;