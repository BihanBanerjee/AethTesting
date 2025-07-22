// src/app/(protected)/dashboard/ask-question-card/hooks/use-intent-handling.ts
import { useEffect, useCallback } from 'react';
import { useIntentClassifier } from '@/components/code-assistant/intent-classifier-wrapper';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';
import type { QuestionState } from '../types/enhanced-response';

interface UseIntentHandlingProps {
  state: QuestionState;
  setIntentPreview: (preview: any) => void;
  setProcessingStage: (stage: 'analyzing' | 'processing' | 'generating' | 'complete') => void;
  setAvailableFiles: (files: string[]) => void;
}

export function useIntentHandling({ 
  state, 
  setIntentPreview, 
  setProcessingStage, 
  setAvailableFiles 
}: UseIntentHandlingProps) {
  const { project } = useProject();
  const { classifyQuery: clientClassifyQuery, isReady } = useIntentClassifier();
  
  // Server-side classification mutation
  const serverClassifyMutation = api.project.classifyIntent.useMutation();
  
  // Stable classification function that uses server-side when possible
  const classifyQuery = useCallback(async (query: string, context?: any) => {
    if (project?.id) {
      // Use server-side classification
      const result = await serverClassifyMutation.mutateAsync({
        projectId: project.id,
        query,
        contextFiles: context?.availableFiles || []
      });
      return result.intent;
    } else {
      // Fallback to client-side classification
      return await clientClassifyQuery(query, context);
    }
  }, [project?.id, serverClassifyMutation, clientClassifyQuery]);

  // Get available files for context selection
  const { data: projectFiles } = api.project.getProjectFiles?.useQuery(
    { projectId: project?.id || '' },
    { 
      enabled: !!project?.id,
    }
  );

  // Set available files when data changes
  useEffect(() => {
    if (projectFiles) {
      setAvailableFiles(projectFiles.map(f => f.fileName) || []);
    }
  }, [projectFiles, setAvailableFiles]);

  // Intent classification preview
  useEffect(() => {
    if (state.question.length > 10 && (project?.id || isReady)) {
      const timer = setTimeout(async () => {
        try {
          setProcessingStage('analyzing');
          const intent = await classifyQuery(state.question, { 
            availableFiles: state.availableFiles,
            selectedFiles: state.selectedFiles 
          });
          setIntentPreview(intent);
        } catch (error) {
          console.error('Intent preview failed:', error);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [state.question, state.availableFiles, state.selectedFiles, project?.id, isReady, classifyQuery, setIntentPreview, setProcessingStage]);

  return {
    project,
    isReady,
    classifyQuery,
    projectFiles,
  };
}