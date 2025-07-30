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
  // Unescape newlines and other escaped characters for proper display
  const processedCode = generatedCode
    .replace(/\\n/g, '\n')      // Convert \n to actual newlines
    .replace(/\\r/g, '\r')      // Convert \r to carriage returns  
    .replace(/\\t/g, '\t')      // Convert \t to tabs
    .replace(/\\"/g, '"')       // Convert \" to quotes
    .replace(/\\\\/g, '\\');    // Convert \\ to single backslash

  const handleCopy = () => onCopy(processedCode);
  const handleDownload = () => {
    const filename = `generated-${intent}.${language === 'typescript' ? 'ts' : 'js'}`;
    onDownload(processedCode, filename);
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
        code={processedCode}
        language={language}
        actions={{
          copy: true,
          download: true
        }}
      />
    </div>
  );
};