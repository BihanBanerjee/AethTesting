'use client'

import { useState } from 'react';
import { toast } from 'sonner';
import { buildEnhancedMetadata } from '../utils/metadata-builder';
import { createEnhancedFileReferences } from '../utils/file-references';
import type { EnhancedResponse, Project, SaveAnswerMutation, FeedbackData } from '../types/enhanced-save-button.types';

export function useSaveHandler(
  response: EnhancedResponse | null,
  project: Project | null,
  question: string,
  selectedFiles: string[],
  saveAnswer: SaveAnswerMutation,
  refetch: () => void
) {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSaveWithFeedback = (feedback?: FeedbackData) => {
    if (!response || !project) {
      toast.error('No response or project available to save');
      return;
    }

    const enhancedMetadata = buildEnhancedMetadata(response, selectedFiles, feedback);
    const finalFilesReferences = createEnhancedFileReferences(response);

    console.log('Saving enhanced response with metadata:', enhancedMetadata);
    console.log('Final filesReferences:', finalFilesReferences);

    saveAnswer.mutate({
      projectId: project.id,
      question,
      answer: response.content,
      filesReferences: finalFilesReferences,
      metadata: enhancedMetadata
    }, {
      onSuccess: (result) => {
        toast.success('Response saved successfully!');
        
        // Show analytics info if available
        if (result?.analytics) {
          const analyticsMsg = [
            result.analytics.aiInteractionCreated && 'AI interaction tracked',
            result.analytics.codeGenerationCreated && 'Code generation recorded',
            result.analytics.fileAnalyticsUpdated && result.analytics.fileAnalyticsUpdated > 0 && `${result.analytics.fileAnalyticsUpdated} files analyzed`,
            result.analytics.suggestionFeedbackCreated && 'Feedback recorded'
          ].filter(Boolean).join(', ');
          
          if (analyticsMsg) {
            toast.success(`Analytics: ${analyticsMsg}`, { duration: 3000 });
          }
        }
        
        setShowFeedback(false);
        refetch();
      },
      onError: (error) => {
        console.error('Failed to save response:', error);
        toast.error('Failed to save response: ' + (error?.message || 'Unknown error'));
      }
    });
  };

  const handleQuickSave = () => {
    handleSaveWithFeedback();
  };

  return {
    showFeedback,
    setShowFeedback,
    handleSaveWithFeedback,
    handleQuickSave
  };
}