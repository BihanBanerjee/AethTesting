import { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateWizard } from './use-create-wizard';
import { useProjectCreation } from './use-project-creation';

export type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
};

export interface CreateComposition {
  // Form state
  register: any;
  handleSubmit: any;
  reset: () => void;
  watch: any;
  formValues: {
    projectName: string;
    repoUrl: string;
    githubToken?: string;
  };
  
  // Wizard state
  activeStep: number;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: 1 | 2 | 3) => void;
  resetWizard: () => void;
  
  // Project creation
  isCreating: boolean;
  isCheckingCredits: boolean;
  creditsData: any;
  hasEnoughCredits: boolean;
  error: string | null;
  
  // Actions
  handleFormSubmit: (data: FormInput) => Promise<void>;
  handleCreateProject: () => Promise<void>;
}

export function useCreateComposition(): CreateComposition {
  const { register, handleSubmit, reset: resetForm, watch } = useForm<FormInput>();
  const wizard = useCreateWizard();
  
  const projectCreation = useProjectCreation(
    () => {
      // On success: go to success step and reset form
      wizard.goToStep(3);
      resetForm();
    },
    () => {
      // On credits checked: go to review step
      wizard.nextStep();
    }
  );

  // Watch form values
  const projectName = watch('projectName') || '';
  const repoUrl = watch('repoUrl') || '';
  const githubToken = watch('githubToken');

  const formValues = useMemo(() => ({
    projectName,
    repoUrl,
    githubToken,
  }), [projectName, repoUrl, githubToken]);

  const handleFormSubmit = useCallback(async (data: FormInput) => {
    if (projectCreation.creditsData) {
      // If we already have credits data, create the project
      await projectCreation.createProject(data);
    } else {
      // Otherwise, check credits first
      await projectCreation.checkProjectCredits({
        repoUrl: data.repoUrl,
        githubToken: data.githubToken
      });
    }
  }, [projectCreation]);

  const handleCreateProject = useCallback(async () => {
    if (!formValues.projectName || !formValues.repoUrl) {
      throw new Error('Missing required form data');
    }
    
    await projectCreation.createProject({
      projectName: formValues.projectName,
      repoUrl: formValues.repoUrl,
      githubToken: formValues.githubToken,
    });
  }, [projectCreation, formValues]);

  const reset = useCallback(() => {
    resetForm();
    wizard.reset();
  }, [resetForm, wizard]);

  return {
    // Form state
    register,
    handleSubmit,
    reset,
    watch,
    formValues,
    
    // Wizard state
    activeStep: wizard.activeStep,
    nextStep: wizard.nextStep,
    previousStep: wizard.previousStep,
    goToStep: wizard.goToStep,
    resetWizard: wizard.reset,
    
    // Project creation
    isCreating: projectCreation.isCreating,
    isCheckingCredits: projectCreation.isCheckingCredits,
    creditsData: projectCreation.creditsData,
    hasEnoughCredits: projectCreation.hasEnoughCredits,
    error: projectCreation.error,
    
    // Actions
    handleFormSubmit,
    handleCreateProject,
  };
}