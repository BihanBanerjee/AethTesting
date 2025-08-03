import { useState, useCallback } from 'react';

export type CreateStep = 1 | 2 | 3;

export interface CreateWizardState {
  activeStep: CreateStep;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: CreateStep) => void;
  reset: () => void;
  canGoNext: boolean;
  canGoBack: boolean;
}

export function useCreateWizard(): CreateWizardState {
  const [activeStep, setActiveStep] = useState<CreateStep>(1);

  const nextStep = useCallback(() => {
    setActiveStep(current => {
      if (current < 3) return (current + 1) as CreateStep;
      return current;
    });
  }, []);

  const previousStep = useCallback(() => {
    setActiveStep(current => {
      if (current > 1) return (current - 1) as CreateStep;
      return current;
    });
  }, []);

  const goToStep = useCallback((step: CreateStep) => {
    setActiveStep(step);
  }, []);

  const reset = useCallback(() => {
    setActiveStep(1);
  }, []);

  return {
    activeStep,
    nextStep,
    previousStep,
    goToStep,
    reset,
    canGoNext: activeStep < 3,
    canGoBack: activeStep > 1,
  };
}