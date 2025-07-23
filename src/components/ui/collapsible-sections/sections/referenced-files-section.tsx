'use client';

import React from 'react';
import { Files, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CodeReferences from '@/app/(protected)/dashboard/code-references';
import { CollapsibleSection } from '../collapsible-section';
import type { FileReference, SectionPriority } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface ReferencedFilesSectionProps {
  filesReferences: FileReference[];
  isOpen: boolean;
  onToggle: () => void;
  priority: SectionPriority;
  className?: string;
}

export const ReferencedFilesSection: React.FC<ReferencedFilesSectionProps> = ({
  filesReferences,
  isOpen,
  onToggle,
  priority,
  className
}) => {
  const copyAllFiles = () => {
    const allContent = filesReferences
      .map(file => `// ${file.fileName}\n\n${file.sourceCode}`)
      .join('\n\n' + '='.repeat(50) + '\n\n');
    navigator.clipboard.writeText(allContent);
  };

  const downloadAllFiles = () => {
    const allContent = filesReferences
      .map(file => `// ${file.fileName}\n\n${file.sourceCode}`)
      .join('\n\n' + '='.repeat(50) + '\n\n');
    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'referenced-files.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const actions = filesReferences.length > 1 ? (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyAllFiles}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Copy all files"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={downloadAllFiles}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Download all files"
      >
        <Download className="h-3 w-3" />
      </Button>
    </>
  ) : undefined;

  const getFileTypeStats = () => {
    const types = filesReferences.reduce((acc, file) => {
      const ext = file.fileName.split('.').pop()?.toLowerCase() || 'unknown';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(types)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
  };

  return (
    <CollapsibleSection
      title="Referenced Files"
      icon={Files}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={`${filesReferences.length} file${filesReferences.length !== 1 ? 's' : ''}`}
      actions={actions}
      priority={priority}
      className={className}
    >
      <div className="space-y-4">
        <div className="text-sm text-white/60 bg-white/5 rounded px-3 py-2 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="font-medium">Files:</span>
            <span className="text-white/80">{getFileTypeStats()}</span>
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="text-xs text-blue-300 mb-1 font-medium">
            Context Files
          </div>
          <div className="text-xs text-blue-200">
            These files were referenced to provide context for the AI response
          </div>
        </div>
        
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <CodeReferences
            filesReferences={filesReferences}
            className="border-0 bg-transparent p-0"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
};