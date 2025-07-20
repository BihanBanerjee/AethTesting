'use client'

import { api } from '@/trpc/react';
import { detectDetailLevel, detectImprovementType, detectReviewType, extractConstraints, extractFeatures } from '@/utils/use-code-assistant-utils';
import type { QueryIntent } from '@/lib/intent-classifier';
import type { ProcessingStage } from '@/types/code-assistant';
import type { APIRoutingState } from '../types/use-code-assistant.types';

export function useAPIRouting(
  selectedFiles: string[],
  setProcessingStage: (stage: ProcessingStage) => void,
  setProgress: (progress: number) => void
): APIRoutingState {
  // API mutations
  const askQuestion = api.project.askQuestionWithIntent.useMutation();
  const generateCode = api.project.generateCode.useMutation();
  const improveCode = api.project.improveCode.useMutation();
  const reviewCode = api.project.reviewCode.useMutation();
  const debugCode = api.project.debugCode.useMutation();
  const explainCode = api.project.explainCode.useMutation();

  const routeIntentToAPI = async (intent: QueryIntent, input: string, projectId: string) => {
    switch (intent.type) {
      case 'code_generation':
        setProcessingStage('generating');
        setProgress(70);
        
        return await generateCode.mutateAsync({
          projectId,
          prompt: input,
          context: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          requirements: {
            framework: 'react',
            language: 'typescript',
            features: extractFeatures(input),
            constraints: extractConstraints(input)
          }
        });
        
      case 'code_improvement':
        return await improveCode.mutateAsync({
          projectId,
          suggestions: input,
          targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          improvementType: detectImprovementType(input)
        });
        
      case 'code_review':
        return await reviewCode.mutateAsync({
          projectId,
          files: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [],
          reviewType: detectReviewType(input),
          focusAreas: input
        });
        
      case 'debug':
        return await debugCode.mutateAsync({
          projectId,
          errorDescription: input,
          suspectedFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          contextLevel: intent.contextNeeded || 'project'
        });
        
      case 'explain':
        return await explainCode.mutateAsync({
          projectId,
          query: input,
          targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          detailLevel: detectDetailLevel(input)
        });
        
      default:
        return await askQuestion.mutateAsync({
          projectId,
          query: input,
          contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          intent: intent.type
        });
    }
  };

  return {
    routeIntentToAPI
  };
}