'use client'

import { useCallback } from 'react';
import { api } from '@/trpc/react';
import { toast } from 'sonner';

interface InteractionFeedbackData {
  rating?: number;
  helpful?: boolean;
  feedback?: string;
}

interface CodeGenerationFeedbackData {
  satisfaction?: number;
  applied?: boolean;
  modified?: boolean;
}

export const useFeedbackPersistence = () => {
  const updateInteractionFeedback = api.project.updateInteractionFeedback.useMutation();
  const updateCodeFeedback = api.project.updateCodeGenerationFeedback.useMutation();

  const saveInteractionFeedback = useCallback(async (
    interactionId: string,
    feedback: InteractionFeedbackData
  ) => {
    try {
      await updateInteractionFeedback.mutateAsync({
        interactionId,
        ...feedback
      });
      
      toast.success('Feedback saved successfully!');
      return true;
    } catch (error) {
      console.error('Failed to save interaction feedback:', error);
      toast.error('Failed to save feedback. Please try again.');
      return false;
    }
  }, [updateInteractionFeedback]);

  const saveCodeGenerationFeedback = useCallback(async (
    codeGenerationId: string,
    feedback: CodeGenerationFeedbackData
  ) => {
    try {
      await updateCodeFeedback.mutateAsync({
        codeGenerationId,
        ...feedback
      });
      
      toast.success('Code feedback saved!');
      return true;
    } catch (error) {
      console.error('Failed to save code generation feedback:', error);
      toast.error('Failed to save code feedback. Please try again.');
      return false;
    }
  }, [updateCodeFeedback]);


  return {
    saveInteractionFeedback,
    saveCodeGenerationFeedback,
    isLoading: updateInteractionFeedback.isPending || updateCodeFeedback.isPending,
    error: updateInteractionFeedback.error || updateCodeFeedback.error
  };
};