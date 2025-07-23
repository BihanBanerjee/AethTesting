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
  
  // Server-side classification mutation with basic error handling
  const serverClassifyMutation = api.project.classifyIntent.useMutation({
    retry: 1, // Allow 1 retry for transient failures
    onError: (error) => {
      console.error('Intent classification failed:', error);
    }
  });
  
  // Simplified classification function for on-submit use
  const classifyQuery = useCallback(async (query: string, context?: any) => {
    try {
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
    } catch (error) {
      console.error('Intent classification failed, using default:', error);
      // Return default intent on failure
      return {
        type: 'question',
        confidence: 0.5,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'none'
      };
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

  // Removed real-time intent classification - now happens on submit

  return {
    project,
    isReady,
    classifyQuery,
    projectFiles,
  };
}