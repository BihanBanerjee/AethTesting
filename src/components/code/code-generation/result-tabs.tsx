import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EnhancedCodeBlock } from '../code-viewer';
import { DiffViewer } from '../diff-viewer/index';
import { SuggestionsList } from './suggestions-list';
import { SatisfactionSlider } from '@/components/feedback';
import { useFeedbackPersistence } from '@/hooks/use-feedback-persistence';
import type { ResultTabsProps } from '../shared/types';

export const ResultTabs: React.FC<ResultTabsProps> = ({
  result,
  onApplyChanges
}) => {
  // Feedback state
  const [satisfaction, setSatisfaction] = useState<number>(5);
  const [applied, setApplied] = useState<boolean>(false);
  const [modified, setModified] = useState<boolean>(false);
  const { saveCodeGenerationFeedback, isLoading: savingFeedback } = useFeedbackPersistence();

  const handleApply = async () => {
    await onApplyChanges(result);
    setApplied(true);
    // Auto-save applied status if we have a code generation ID
    if (result.id) {
      try {
        await saveCodeGenerationFeedback(result.id, { applied: true });
      } catch (error) {
        console.warn('Failed to save applied status:', error);
      }
    }
  };

  const handleSatisfactionChange = async (newSatisfaction: number) => {
    setSatisfaction(newSatisfaction);
    if (result.id) {
      try {
        await saveCodeGenerationFeedback(result.id, { satisfaction: newSatisfaction });
      } catch (error) {
        console.warn('Failed to save satisfaction rating:', error);
      }
    }
  };

  const handleModifiedChange = async (isModified: boolean) => {
    setModified(isModified);
    if (result.id) {
      try {
        await saveCodeGenerationFeedback(result.id, { modified: isModified });
      } catch (error) {
        console.warn('Failed to save modified status:', error);
      }
    }
  };

  // Determine the number of tabs to set the correct grid columns
  const hasOriginalCode = !!result.originalCode;
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

      {/* Code Generation Feedback Section */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white">Code Feedback</span>
          {savingFeedback && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400"></div>
              Saving...
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Satisfaction Slider */}
          <SatisfactionSlider
            satisfaction={satisfaction}
            onSatisfactionChange={handleSatisfactionChange}
            disabled={savingFeedback}
          />
          
          {/* Code Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApply}
                className={`text-xs ${
                  applied 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                disabled={applied || savingFeedback}
              >
                {applied ? '✅ Applied' : '📋 Apply Code'}
              </Button>
              
              <Button
                onClick={() => handleModifiedChange(!modified)}
                variant="outline"
                className={`text-xs border-white/20 ${
                  modified 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                disabled={savingFeedback}
              >
                {modified ? '✏️ Modified' : '✏️ I Modified This'}
              </Button>
            </div>
          </div>
          
          {(applied || modified || satisfaction !== 5) && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-white/50 text-center">
                Thank you for your feedback! This helps improve code generation.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};