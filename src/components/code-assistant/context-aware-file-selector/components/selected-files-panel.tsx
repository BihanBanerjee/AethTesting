'use client'

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { getFileDisplayName } from '../utils/intent-file-mapping';
import type { SelectedFilesPanelProps } from '../types';

export const SelectedFilesPanel: React.FC<SelectedFilesPanelProps> = ({
  selectedFiles,
  onFileToggle,
  onClearAll
}) => {
  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <div className="glassmorphism border border-white/20 p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-white/60" />
        <span className="text-sm font-medium text-white/80">
          Selected Files ({selectedFiles.length})
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onClearAll}
          className="border-white/20 bg-white/10 text-white text-xs ml-auto"
        >
          Clear All
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {selectedFiles.map((file, index) => (
          <Badge
            key={index}
            variant="outline"
            className="border-white/20 bg-white/10 cursor-pointer hover:bg-red-500/20"
            onClick={() => onFileToggle(file)}
          >
            {getFileDisplayName(file)}
            <span className="ml-1 text-white/40">×</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};