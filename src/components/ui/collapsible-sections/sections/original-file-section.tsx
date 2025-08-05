'use client';

import React from 'react';
import { FileText, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import { CollapsibleSection } from '../collapsible-section';
import { copyToClipboard, downloadCode } from '@/lib/intent';
import type { FileData, SectionPriority } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface OriginalFileSectionProps {
  fileData: FileData;
  isOpen: boolean;
  onToggle: () => void;
  priority: SectionPriority;
  className?: string;
}

export const OriginalFileSection: React.FC<OriginalFileSectionProps> = ({
  fileData,
  isOpen,
  onToggle,
  priority,
  className
}) => {
  const handleCopy = () => {
    copyToClipboard(fileData.content, `${fileData.filename} copied to clipboard`);
  };

  const handleDownload = () => {
    downloadCode(fileData.content, fileData.filename, `${fileData.filename} downloaded`);
  };

  const actions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Copy file content"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Download file"
      >
        <Download className="h-3 w-3" />
      </Button>
    </>
  );

  const getFileName = () => {
    const parts = fileData.filename.split('/');
    return parts[parts.length - 1];
  };

  const getFilePath = () => {
    const parts = fileData.filename.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
  };

  return (
    <CollapsibleSection
      title="Original File"
      icon={FileText}
      isOpen={isOpen}
      onToggle={onToggle}
      badge="before"
      actions={actions}
      priority={priority}
      className={className}
    >
      <div className="space-y-4">
        <div className="text-sm text-white/60 bg-white/5 rounded px-3 py-2 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-medium">File:</span>
            <span className="text-white/40">{getFilePath()}</span>
            <span className="text-white/80">{getFileName()}</span>
          </div>
        </div>
        
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <div className="text-xs text-orange-300 mb-1 font-medium">
            Original Content
          </div>
          <div className="text-xs text-orange-200">
            This shows the file content before any modifications
          </div>
        </div>
        
        <CodeBlock
          code={fileData.content}
          language={fileData.language}
          filename={fileData.filename}
        />
      </div>
    </CollapsibleSection>
  );
};