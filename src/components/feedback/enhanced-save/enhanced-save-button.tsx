'use client'

import React from 'react';
import { FeedbackCollector } from '../feedback-collector';
import { SaveActionButtons } from '../components/save-action-buttons';
import { useSaveHandler } from '../hooks/use-save-handler';
import type { EnhancedSaveButtonProps } from '../types/enhanced-save-button.types';

export const EnhancedSaveButton: React.FC<EnhancedSaveButtonProps> = ({
  response,
  project,
  question,
  selectedFiles,
  saveAnswer,
  refetch
}) => {
  const {
    showFeedback,
    setShowFeedback,
    handleSaveWithFeedback,
    handleQuickSave
  } = useSaveHandler(response, project, question, selectedFiles, saveAnswer, refetch);

  if (!response || !project) {
    return null;
  }

  const hasGeneratedCode = !!(response.metadata?.generatedCode);

  return (
    <div className="flex flex-col">
      <SaveActionButtons
        showFeedback={showFeedback}
        isLoading={saveAnswer.isPending}
        onToggleFeedback={() => setShowFeedback(!showFeedback)}
        onQuickSave={handleQuickSave}
        onCloseFeedback={() => setShowFeedback(false)}
      />

      {/* Feedback Collector */}
      {showFeedback && (
        <FeedbackCollector
          onFeedback={handleSaveWithFeedback}
          hasGeneratedCode={hasGeneratedCode}
          isLoading={saveAnswer.isPending}
        />
      )}
    </div>
  );
};