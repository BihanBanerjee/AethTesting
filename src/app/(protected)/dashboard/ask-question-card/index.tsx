// src/app/(protected)/dashboard/ask-question-card/index.tsx
'use client';

import React from 'react';
import type { QueryIntent } from '@/lib/intent-classifier';
import { toast } from 'sonner';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
// import { ContextAwareFileSelector } from '@/components/code-assistant/context-aware-file-selector';
import { MessageSquare, Sparkles, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import hooks
import { useDashboardState, useDashboardActions } from '@/contexts/dashboard-context';
import { useApiMutations } from './hooks/use-api-mutations';
import useProject from '@/hooks/use-project';
import { useIntentClassification } from '@/hooks/use-intent-classification';

// Import components
import { QuestionInput } from './components/question-input';
import { ResponseDisplay } from './components/response-display';
import { ResponseModal } from '@/components/ui/response-modal';

// Import utilities
import { routeIntentToHandler } from './utils/intent-router';

const EnhancedAskQuestionCardContent: React.FC = () => {
  const state = useDashboardState();
  const actions = useDashboardActions();
  const mutations = useApiMutations();
  
  // Use focused hooks for better separation of concerns
  const { project } = useProject();
  const { classifyQuery } = useIntentClassification();
  
  // Simple readiness check (replacing useProjectContext)
  const isReady = !!(project?.id && project?.status);

  // Available files are automatically synced through useProjectFiles in the unified file selection hook

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project?.id || !state.question.trim()) return;

    actions.setResponse(null);
    actions.setLoading(true);
    actions.setProcessingStage('analyzing');
    
    try {
      // First classify the intent - this will be visible to user
      const intent = await classifyQuery(state.question);

      // Store the intent for display in UI  
      actions.setIntentPreview(intent as QueryIntent);
      actions.setProcessingStage('generating');
      
      // Route to appropriate handler
      const response = await routeIntentToHandler(
        intent,
        state.question,
        project.id,
        state.selectedFiles,
        mutations
      );

      actions.setResponse(response);
      actions.setProcessingStage('complete');
      actions.setActiveTab('response');
    } catch (error) {
      console.error('Error processing question:', error);
      toast.error('Failed to process question. Please try again.');
    } finally {
      actions.setLoading(false);
    }
  };

  const handleSaveAnswer = async (_questionId: string, answer: string, rating: number) => {
    if (!project?.id) return;

    try {
      await mutations.saveAnswer.mutateAsync({
        projectId: project.id,
        question: state.question,
        answer,
        rating,
        filesReferences: state.response?.filesReferences || []
      });
      
      toast.success('Answer saved successfully!');
      mutations.refetch();
      
      // Clear persisted state since the answer has been saved to database
      actions.clearPersistedState();
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <GlassmorphicCard className="p-8 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl min-h-fit">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                Ask Aetheria
              </h3>
              <p className="text-sm text-white/60 mt-1">
                Get intelligent answers about your codebase
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-white/70">AI-Powered</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                actions.setShowModal(true);
                // Ensure response tab is selected when modal opens
                if (state.response) {
                  actions.setActiveTab('response');
                }
              }}
              className="text-white/60 hover:text-white hover:bg-white/10 p-2 ml-2"
              title="Open in dialog"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <QuestionInput
          question={state.question}
          onQuestionChange={actions.setQuestion}
          onSubmit={onSubmit}
          loading={state.loading}
          disabled={!isReady}
          availableFiles={state.availableFiles}
          selectedFiles={state.selectedFiles}
          onFileSelect={actions.setSelectedFiles}
          intentPreview={state.intentPreview}
          processingStage={state.processingStage}
          projectId={project?.id}
        />

        {/* Context aware file selector temporarily disabled due to prop interface mismatch */}
        {state.selectedFiles.length > 0 && (
          <div className="mt-4 p-2 bg-white/5 rounded-lg">
            <div className="text-sm text-white/70 mb-2">Selected Files:</div>
            <div className="flex flex-wrap gap-2">
              {state.selectedFiles.map((file) => (
                <span key={file} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                  {file}
                </span>
              ))}
            </div>
          </div>
        )}

        {state.response && (
          <div className="mt-6">
            <ResponseDisplay
              response={state.response}
              activeTab={state.activeTab}
              onTabChange={actions.setActiveTab}
              onSaveAnswer={handleSaveAnswer}
              projectId={project?.id || ''}
            />
          </div>
        )}
      </GlassmorphicCard>
      
      {/* Response Modal */}
      <ResponseModal
        isOpen={state.showModal}
        onClose={() => actions.setShowModal(false)}
        response={state.response}
        question={state.question}
        activeTab={state.activeTab}
        onTabChange={actions.setActiveTab}
        projectId={project?.id || ''}
        isStreaming={state.loading && !state.response}
        streamingContent={state.streamingContent}
      />
    </div>
  );
};

const EnhancedAskQuestionCard: React.FC = () => {
  return <EnhancedAskQuestionCardContent />;
};

export default EnhancedAskQuestionCard;