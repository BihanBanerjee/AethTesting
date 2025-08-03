// src/app/(protected)/create/CreatePageOptimized.tsx
'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateComposition } from '@/hooks/create';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Import our modularized components using the index file
import {
  BackgroundAnimation,
  PageHeader,
  StepsIndicator,
  RepositoryForm,
  CreditsReview,
  SuccessConfirmation
} from './components';

const CreatePageOptimized = () => {
  const {
    // Form state
    register,
    handleSubmit,
    formValues,
    
    // Wizard state
    activeStep,
    resetWizard,
    
    // Project creation state
    isCreating,
    isCheckingCredits,
    creditsData,
    hasEnoughCredits,
    error,
    
    // Actions
    handleFormSubmit,
    handleCreateProject,
  } = useCreateComposition();

  return (
    <div className='min-h-full flex items-center justify-center py-12 text-white'>
      {/* Background animation elements */}
      <BackgroundAnimation />
      
      <motion.div
        className='flex flex-col items-center max-w-5xl w-full px-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Page Header */}
        <PageHeader />
        
        {/* Steps indicator */}
        <StepsIndicator activeStep={activeStep} />
        
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mb-6"
          >
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {/* Main content container */}
        <div className="w-full max-w-5xl">
          <AnimatePresence mode="wait">
            {activeStep === 1 && (
              <RepositoryForm 
                register={register}
                handleSubmit={handleSubmit}
                onSubmit={handleFormSubmit}
                isLoading={isCheckingCredits}
              />
            )}
            
            {activeStep === 2 && creditsData && (
              <CreditsReview
                projectName={formValues.projectName}
                repoUrl={formValues.repoUrl}
                githubToken={formValues.githubToken}
                creditsData={creditsData}
                hasEnoughCredits={hasEnoughCredits}
                isCreating={isCreating}
                onBack={() => resetWizard()}
                onCreateProject={handleCreateProject}
              />
            )}
            
            {activeStep === 3 && (
              <SuccessConfirmation 
                onCreateAnother={() => resetWizard()} 
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePageOptimized;