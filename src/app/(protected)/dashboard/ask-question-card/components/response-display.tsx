// src/app/(protected)/dashboard/ask-question-card/components/response-display.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import { DiffViewer } from '@/components/code/diff-viewer/index';
import CodeReferences from '../../code-references';
// import { EnhancedSaveButton } from '@/components/feedback/enhanced-save-button';
import { DarkMarkdown } from '@/components/ui/dark-markdown';
import { copyToClipboard } from '@/lib/intent';
import type { EnhancedResponse, ActiveTab } from '../types/enhanced-response';
import { 
  Code, 
  FileText, 
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  InfoIcon,
} from 'lucide-react';
import { RatingStars, HelpfulToggle } from '@/components/feedback';
import { useFeedbackPersistence } from '@/hooks/use-feedback-persistence';
import { useState } from 'react';

interface ResponseDisplayProps {
  response: EnhancedResponse;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onSaveAnswer: (questionId: string, answer: string, rating: number) => void;
  projectId: string;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  response,
  activeTab,
  onTabChange,
  onSaveAnswer,
  projectId
}) => {
  // Feedback state management
  const [rating, setRating] = useState<number>(response.feedback?.rating || 0);
  const [helpful, setHelpful] = useState<boolean | null>(response.feedback?.helpful ?? null);
  const { saveInteractionFeedback, isLoading: savingFeedback } = useFeedbackPersistence();


  // Handle feedback changes with immediate persistence
  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);
    if (response.feedback?.interactionId) {
      await saveInteractionFeedback(response.feedback.interactionId, { rating: newRating });
    }
  };

  const handleHelpfulChange = async (newHelpful: boolean) => {
    setHelpful(newHelpful);
    if (response.feedback?.interactionId) {
      await saveInteractionFeedback(response.feedback.interactionId, { helpful: newHelpful });
    }
  };

  const downloadResponse = () => {
    const blob = new Blob([response.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getResponseTypeIcon = () => {
    switch (response.type) {
      case 'code': return <Code className="h-4 w-4" />;
      case 'review': return <CheckCircle className="h-4 w-4" />;
      case 'debug': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResponseTypeColor = () => {
    switch (response.type) {
      case 'code': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'review': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'debug': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Response Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getResponseTypeIcon()}
            <Badge className={getResponseTypeColor()}>
              {response.type?.replace('_', ' ') || 'Response'}
            </Badge>
          </div>
          <div className="text-sm text-white/60">
            Confidence: {Math.round((response.intent?.confidence || 0) * 100)}%
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(response.content, 'Response copied to clipboard')}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
            title="Copy response"
          >
            <Copy className="h-4 w-4 text-white/60" />
          </button>
          <button
            onClick={downloadResponse}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
            title="Download response"
          >
            <Download className="h-4 w-4 text-white/60" />
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ActiveTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10">
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="response" className="space-y-4">
          <div className="enhanced-response-area p-6 max-h-[600px] overflow-y-auto">
            <DarkMarkdown content={response.content} />
          </div>
          
          {/* Metadata Display */}
          {response.metadata && (
            <div className="space-y-3">
              {response.metadata.warnings && response.metadata.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-300 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Warnings</span>
                  </div>
                  <ul className="text-sm text-yellow-200 space-y-1">
                    {response.metadata.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {response.metadata.suggestions && response.metadata.suggestions.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-300 mb-2">
                    <InfoIcon className="h-4 w-4" />
                    <span className="font-medium">Suggestions</span>
                  </div>
                  <ul className="text-sm text-blue-200 space-y-1">
                    {response.metadata.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {response.metadata.insights && response.metadata.insights.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-300 mb-2">
                    <InfoIcon className="h-4 w-4" />
                    <span className="font-medium">Insights</span>
                  </div>
                  <ul className="text-sm text-green-200 space-y-1">
                    {response.metadata.insights.map((insight, index) => (
                      <li key={index}>• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          {response.metadata?.generatedCode && (
            <CodeBlock
              code={response.metadata.generatedCode}
              language={response.metadata.language || 'typescript'}
              filename={response.metadata.files?.[0] || 'generated-code'}
            />
          )}
          
          {response.metadata?.diff && typeof response.metadata.diff === 'object' && (
            <DiffViewer
              original={(response.metadata.diff as any).original || ''}
              modified={(response.metadata.diff as any).modified || ''}
              filename={response.metadata.files?.[0] || 'modified-code'}
            />
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          {response.filesReferences && response.filesReferences.length > 0 ? (
            <CodeReferences
              filesReferences={response.filesReferences}
              className=""
            />
          ) : (
            <div className="text-center py-12 text-white/60">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No files referenced</p>
              <p className="text-sm mt-2">This response doesn't include any specific file references</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Feedback Section */}
      <div className="feedback-section mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white">How was this response?</span>
          {savingFeedback && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400"></div>
              Saving...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rating Section */}
          <div className="space-y-2">
            <span className="text-xs text-white/70">Rate this response:</span>
            <RatingStars
              rating={rating}
              onRatingChange={handleRatingChange}
              size="sm"
              disabled={savingFeedback}
            />
          </div>
          
          {/* Helpful Section */}
          <div className="space-y-2">
            <span className="text-xs text-white/70">Was this helpful?</span>
            <HelpfulToggle
              helpful={helpful}
              onHelpfulChange={handleHelpfulChange}
              disabled={savingFeedback}
              compact={true}
            />
          </div>
        </div>
        
        {(rating > 0 || helpful !== null) && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs text-white/50 text-center">
              Thank you for your feedback! This helps improve AI responses.
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => onSaveAnswer(projectId, response.content, rating || 5)}
          disabled={!response.content}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Save Answer
        </button>
      </div>
    </div>
  );
};