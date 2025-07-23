'use client';

import React from 'react';
import { GitCompare, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiffViewer } from '@/components/code/diff-viewer/index';
import { CollapsibleSection } from '../collapsible-section';
import type { DiffData, SectionPriority } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface DiffViewSectionProps {
  diffData: DiffData;
  isOpen: boolean;
  onToggle: () => void;
  priority: SectionPriority;
  className?: string;
}

export const DiffViewSection: React.FC<DiffViewSectionProps> = ({
  diffData,
  isOpen,
  onToggle,
  priority,
  className
}) => {
  const copyDiff = () => {
    const diffText = `--- a/${diffData.filename}\n+++ b/${diffData.filename}\n${diffData.original}\n---\n${diffData.modified}`;
    navigator.clipboard.writeText(diffText);
  };

  const downloadDiff = () => {
    const diffText = `--- a/${diffData.filename}\n+++ b/${diffData.filename}\n${diffData.original}\n---\n${diffData.modified}`;
    const blob = new Blob([diffText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diffData.filename}.diff`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyModified = () => {
    navigator.clipboard.writeText(diffData.modified);
  };

  const actions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyModified}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Copy modified code"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={downloadDiff}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Download diff"
      >
        <Download className="h-3 w-3" />
      </Button>
    </>
  );

  const getFileName = () => {
    const parts = diffData.filename.split('/');
    return parts[parts.length - 1];
  };

  const getFilePath = () => {
    const parts = diffData.filename.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
  };

  return (
    <CollapsibleSection
      title="Changes Preview"
      icon={GitCompare}
      isOpen={isOpen}
      onToggle={onToggle}
      badge="diff"
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
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <div className="text-xs text-purple-300 mb-1 font-medium">
            Side-by-Side Comparison
          </div>
          <div className="text-xs text-purple-200">
            Red highlights show removed content, green highlights show added content
          </div>
        </div>
        
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <DiffViewer
            original={diffData.original}
            modified={diffData.modified}
            filename={diffData.filename}
          />
        </div>
      </div>
    </CollapsibleSection>
  );
};