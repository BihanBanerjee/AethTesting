'use client'

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FileText, Zap } from 'lucide-react';
import { getFileDisplayName } from '../utils/intent-file-mapping';
import type { SuggestedFilesPanelProps } from '../types';

export const SuggestedFilesPanel: React.FC<SuggestedFilesPanelProps> = ({
  suggestedFiles,
  currentQuery,
  onFileToggle,
  onSelectAll
}) => {
  if (suggestedFiles.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="glassmorphism border border-indigo-500/30 p-3 rounded-lg bg-indigo-900/20"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-200" />
          <span className="text-sm font-medium text-indigo-200">
            Suggested Files for &quot;{currentQuery?.slice(0, 30)}...&quot;
          </span>
        </div>
        <Button
          size="sm"
          onClick={onSelectAll}
          className="bg-indigo-600/50 hover:bg-indigo-600/70 text-xs"
        >
          Add All
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {suggestedFiles.map((file, index) => (
          <Badge
            key={index}
            variant="outline"
            className="border-indigo-400/30 text-indigo-200 cursor-pointer hover:bg-indigo-600/30"
            onClick={() => onFileToggle(file)}
          >
            <FileText className="h-3 w-3 mr-1" />
            {getFileDisplayName(file)}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
};