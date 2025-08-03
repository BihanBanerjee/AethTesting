import { useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import type { FormInput } from '@/app/(protected)/create/page';

export interface ProjectCreationState {
  isCreating: boolean;
  isCheckingCredits: boolean;
  creditsData: any;
  hasEnoughCredits: boolean;
  createProject: (data: FormInput) => Promise<void>;
  checkProjectCredits: (data: Pick<FormInput, 'repoUrl' | 'githubToken'>) => Promise<void>;
  error: string | null;
}

export function useProjectCreation(
  onSuccess: () => void,
  onCreditsChecked: () => void
): ProjectCreationState {
  const utils = api.useUtils();
  
  const createProjectMutation = api.project.createProject.useMutation();
  const checkCreditsMutation = api.project.checkCredits.useMutation();

  const createProject = useCallback(async (data: FormInput) => {
    try {
      await createProjectMutation.mutateAsync({
        name: data.projectName,
        githubUrl: data.repoUrl,
        githubToken: data.githubToken
      });
      
      toast.success('Project created successfully');
      
      // Refresh project list
      await utils.project.getProjects.invalidate();
      
      onSuccess();
    } catch (error) {
      console.error('Project creation failed:', error);
      toast.error('Failed to create project. Please try again.');
      throw error;
    }
  }, [createProjectMutation, utils.project.getProjects, onSuccess]);

  const checkProjectCredits = useCallback(async (data: Pick<FormInput, 'repoUrl' | 'githubToken'>) => {
    try {
      await checkCreditsMutation.mutateAsync({
        githubUrl: data.repoUrl,
        githubToken: data.githubToken
      });
      
      onCreditsChecked();
    } catch (error) {
      console.error('Credits check failed:', error);
      toast.error('Failed to check repository. Please verify the URL and token.');
      throw error;
    }
  }, [checkCreditsMutation, onCreditsChecked]);

  const hasEnoughCredits = checkCreditsMutation.data?.userCredits 
    ? checkCreditsMutation.data.fileCount <= checkCreditsMutation.data.userCredits 
    : false; // Default to false for safety

  const error = createProjectMutation.error?.message || 
                checkCreditsMutation.error?.message || 
                null;

  return {
    isCreating: createProjectMutation.isPending,
    isCheckingCredits: checkCreditsMutation.isPending,
    creditsData: checkCreditsMutation.data,
    hasEnoughCredits,
    createProject,
    checkProjectCredits,
    error,
  };
}