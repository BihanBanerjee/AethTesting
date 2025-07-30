'use client'

import { api } from '@/trpc/react';
import type { QueryIntent } from '@/lib/intent-classifier';
import type { APIRoutingState } from '../types/use-code-assistant.types';

export function useAPIRouting(
  selectedFiles: string[]
): APIRoutingState {
  // API mutations - Smart Chat now supports ALL coding capabilities
  const askQuestionWithIntent = api.project.askQuestionWithIntent.useMutation();
  const generateCode = api.project.generateCode.useMutation();
  const improveCode = api.project.improveCode.useMutation();
  const reviewCode = api.project.reviewCode.useMutation();
  const debugCode = api.project.debugCode.useMutation();
  const refactorCode = api.project.refactorCode.useMutation();
  const explainCode = api.project.explainCode.useMutation();

  const routeIntentToAPI = async (intent: QueryIntent, input: string, projectId: string) => {
    // Smart Chat now handles ALL intents - comprehensive coding assistant
    const contextFiles = selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [];
    
    switch (intent.type) {
      case 'code_generation':
        return await generateCode.mutateAsync({
          projectId,
          prompt: input,
          context: contextFiles,
          requirements: {
            framework: 'react',
            language: 'typescript'
          }
        });

      case 'code_improvement':
        return await improveCode.mutateAsync({
          projectId,
          suggestions: input,
          targetFiles: contextFiles,
          improvementType: 'optimization'
        });

      case 'code_review':
        return await reviewCode.mutateAsync({
          projectId,
          files: contextFiles,
          reviewType: 'comprehensive',
          focusAreas: input
        });

      case 'debug':
        return await debugCode.mutateAsync({
          projectId,
          errorDescription: input,
          suspectedFiles: contextFiles,
          contextLevel: 'file'
        });

      case 'refactor':
        return await refactorCode.mutateAsync({
          projectId,
          refactoringGoals: input,
          targetFiles: contextFiles,
          preserveAPI: false
        });

      case 'explain':
        return await explainCode.mutateAsync({
          projectId,
          query: input,
          targetFiles: contextFiles,
          detailLevel: 'detailed'
        });

      case 'question':
      default:
        // Fallback to general Q&A for unrecognized intents
        return await askQuestionWithIntent.mutateAsync({
          projectId,
          query: input,
          contextFiles: contextFiles,
          intent: intent.type
        });
    }
  };

  return {
    routeIntentToAPI
  };
}