// src/app/(protected)/dashboard/ask-question-card/hooks/use-intent-handling.ts
import { useEffect } from 'react';
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
  const { classifyQuery, isReady } = useIntentClassifier();

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
    if (state.question.length > 10 && isReady) {
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
  }, [state.question, state.availableFiles, state.selectedFiles, isReady, classifyQuery, setIntentPreview, setProcessingStage]);

  return {
    project,
    isReady,
    classifyQuery,
    projectFiles,
  };
}