import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCodeBlock } from '../code-viewer';
import { DiffViewer } from '../diff-viewer/index';
import { SuggestionsList } from './suggestions-list';
import type { ResultTabsProps } from '../shared/types';

export const ResultTabs: React.FC<ResultTabsProps> = ({
  result,
  onApplyChanges
}) => {
  const handleApply = async () => {
    await onApplyChanges(result);
  };

  // Determine the number of tabs to set the correct grid columns
  const hasOriginalCode = !!result.originalCode;
  const tabCount = hasOriginalCode ? 3 : 2;
  const gridClass = hasOriginalCode ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="p-4 pt-0">
      <Tabs defaultValue="code" className="w-full">
        <TabsList className={`grid w-full ${gridClass}`}>
          <TabsTrigger value="code">Generated Code</TabsTrigger>
          {hasOriginalCode && (
            <TabsTrigger value="diff">Diff View</TabsTrigger>
          )}
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="mt-4">
          <EnhancedCodeBlock
            code={result.generatedCode}
            language={result.language}
            filename={result.filename}
            suggestions={result.suggestions}
            actions={{
              copy: true,
              download: true,
              apply: true
            }}
            onApply={handleApply}
          />
        </TabsContent>
        
        {result.originalCode && (
          <TabsContent value="diff" className="mt-4">
            <DiffViewer
              original={result.originalCode}
              modified={result.generatedCode}
              filename={result.filename}
              language={result.language}
            />
          </TabsContent>
        )}
        
        <TabsContent value="explanation" className="mt-4">
          <div className="glassmorphism border border-white/20 p-4 rounded-lg">
            <h4 className="font-medium text-white mb-2">AI Explanation</h4>
            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {result.explanation
                .replace(/\\n/g, '\n')      // Convert \n to actual newlines
                .replace(/\\r/g, '\r')      // Convert \r to carriage returns  
                .replace(/\\t/g, '\t')      // Convert \t to tabs
                .replace(/\\"/g, '"')       // Convert \" to quotes
                .replace(/\\\\/g, '\\')     // Convert \\ to single backslash
              }
            </div>
            
            <SuggestionsList suggestions={result.suggestions} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};