'use client';

import React from 'react';
import { Code, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import { CollapsibleSection } from '../collapsible-section';
import { copyToClipboard, downloadCode as downloadCodeUtil } from '@/lib/intent';
import type { CodeData, SectionPriority } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface GeneratedCodeSectionProps {
  codeData: CodeData;
  isOpen: boolean;
  onToggle: () => void;
  priority: SectionPriority;
  className?: string;
}

export const GeneratedCodeSection: React.FC<GeneratedCodeSectionProps> = ({
  codeData,
  isOpen,
  onToggle,
  priority,
  className
}) => {
  const handleCopy = () => {
    copyToClipboard(codeData.content, 'Code copied to clipboard');
  };

  const handleDownload = () => {
    const fileName = codeData.filename || `generated-code.${codeData.language === 'typescript' ? 'ts' : codeData.language}`;
    downloadCodeUtil(codeData.content, fileName, `${fileName} downloaded`);
  };

  const actions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Copy code"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
        title="Download code"
      >
        <Download className="h-3 w-3" />
      </Button>
    </>
  );

  return (
    <CollapsibleSection
      title="Generated Code"
      icon={Code}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={codeData.language}
      actions={actions}
      priority={priority}
      className={className}
    >
      <div className="space-y-4">
        {codeData.filename && (
          <div className="text-sm text-white/60 bg-white/5 rounded px-3 py-2 border border-white/10">
            <span className="font-medium">File:</span> {codeData.filename}
          </div>
        )}
        
        <CodeBlock
          code={codeData.content}
          language={codeData.language}
          filename={codeData.filename}
        />
      </div>
    </CollapsibleSection>
  );
};