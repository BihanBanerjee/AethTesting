'use client'

import React from 'react';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FileReferencesSectionProps } from '../types/message-display.types';

export const FileReferencesSection: React.FC<FileReferencesSectionProps> = ({
  files
}) => {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-white mb-2">Referenced Files</h4>
      <div className="flex flex-wrap gap-1">
        {files.map((file, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            {file.split('/').pop()}
          </Badge>
        ))}
      </div>
    </div>
  );
};