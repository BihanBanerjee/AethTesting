'use client'

import React from 'react';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import { getIntentIcon } from '@/lib/intent';
import { MessageActionButtons } from './message-action-buttons';
import type { GeneratedCodeSectionProps } from '../types/message-display.types';

export const GeneratedCodeSection: React.FC<GeneratedCodeSectionProps> = ({
  generatedCode,
  language = 'typescript',
  intent,
  onCopy,
  onDownload
}) => {
  const handleCopy = () => onCopy(generatedCode);
  const handleDownload = () => {
    const filename = `generated-${intent}.${language === 'typescript' ? 'ts' : 'js'}`;
    onDownload(generatedCode, filename);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-white flex items-center">
          {intent && getIntentIcon(intent)}
          <span className="ml-1">Generated Code</span>
        </h4>
        <MessageActionButtons
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
      </div>
      <CodeBlock
        code={generatedCode}
        language={language}
        actions={{
          copy: true,
          download: true
        }}
      />
    </div>
  );
};