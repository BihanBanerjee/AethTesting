// src/app/(protected)/dashboard/ask-question-card/hooks/use-intent-handling.ts
import { useEffect, useCallback } from 'react';
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
  const isReady = !!project?.id; // Simple readiness check based on project availability
  
  // Server-side classification mutation with basic error handling
  const serverClassifyMutation = api.project.classifyIntent.useMutation({
    retry: 1, // Allow 1 retry for transient failures
    onError: (error) => {
      console.error('Intent classification failed:', error);
    }
  });
  
  // Server-side classification function - dashboard always has project?.id
  const classifyQuery = useCallback(async (query: string) => {
    try {
      if (!project?.id) {
        throw new Error('Project not available - cannot classify intent');
      }
      
      // Use server-side classification (secure)
      const result = await serverClassifyMutation.mutateAsync({
        projectId: project.id,
        query,
      });
      return result.intent;
    } catch (error) {
      console.error('Intent classification failed, using default:', error);
      // Return default intent on failure
      return {
        type: 'question',
        confidence: 0.5,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'project'
      };
    }
  }, [project?.id, serverClassifyMutation]);

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