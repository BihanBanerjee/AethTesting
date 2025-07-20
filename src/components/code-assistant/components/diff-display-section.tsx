'use client'

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DiffViewer } from '@/components/code/diff-viewer/index';
import type { DiffDisplaySectionProps } from '../types/message-display.types';

export const DiffDisplaySection: React.FC<DiffDisplaySectionProps> = ({
  diff
}) => {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-white mb-2 flex items-center">
        <RefreshCw className="h-4 w-4 mr-1" />
        Suggested Changes
      </h4>
      <DiffViewer
        original={diff.original}
        modified={diff.modified}
        filename={diff.filename}
      />
    </div>
  );
};