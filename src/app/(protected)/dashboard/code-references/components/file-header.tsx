// src/app/(protected)/dashboard/code-references/components/file-header.tsx
'use client';

import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import type { FileHeaderProps } from '../types/file-reference';

interface FileSummaryProps {
  groupedFiles: Record<string, any[]>;
}

export const FileSummary: React.FC<FileSummaryProps> = ({ groupedFiles }) => {
  if (Object.keys(groupedFiles).length <= 1) return null;

  return (
    <div className="flex gap-3 text-xs">
      {groupedFiles.generated && (
        <div className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-green-400" />
          <span className="text-green-300">
            {groupedFiles.generated.length} Generated
          </span>
        </div>
      )}
      {groupedFiles.original && (
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-white/60" />
          <span className="text-white/70">
            {groupedFiles.original.length} Referenced
          </span>
        </div>
      )}
    </div>
  );
};

export const FileHeader: React.FC<FileHeaderProps> = ({ file }) => {
  return (
    <div className="flex items-center justify-between mb-3 flex-shrink-0">
      <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
        Files & Code
      </h3>
    </div>
  );
};