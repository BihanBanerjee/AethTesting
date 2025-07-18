// src/app/(protected)/dashboard/code-references/components/file-actions.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import type { FileActionsProps } from '../types/file-reference';
import { copyToClipboard, downloadFile } from '../utils/file-actions';

export const FileActions: React.FC<FileActionsProps> = ({ file }) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(file.sourceCode, file.fileName)}
        className="h-6 w-6 p-0 text-white/60 hover:text-white"
        title="Copy content"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => downloadFile(file.sourceCode, file.fileName)}
        className="h-6 w-6 p-0 text-white/60 hover:text-white"
        title="Download file"
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
};