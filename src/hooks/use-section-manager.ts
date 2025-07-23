'use client';

import { useState, useCallback, useMemo } from 'react';
import type { 
  IntentType, 
  SectionState, 
  SectionPriorities,
  SectionData
} from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface DataAvailability {
  hasGeneratedCode: boolean;
  hasOriginalFile: boolean;
  hasDiffView: boolean;
  hasReferencedFiles: boolean;
}

const getSectionPriorities = (intent: IntentType): SectionPriorities => {
  switch (intent) {
    case 'code_generation':
      return {
        generatedCode: 'high',
        originalFile: 'low', // N/A but keeping for consistency
        diffView: 'low', // N/A
        referencedFiles: 'medium'
      };
    case 'code_improvement':
      return {
        generatedCode: 'high',
        originalFile: 'medium',
        diffView: 'high',
        referencedFiles: 'low'
      };
    case 'debug':
      return {
        generatedCode: 'high',
        originalFile: 'high',
        diffView: 'medium',
        referencedFiles: 'medium'
      };
    case 'code_review':
      return {
        generatedCode: 'low', // N/A
        originalFile: 'high',
        diffView: 'low', // N/A
        referencedFiles: 'medium'
      };
    case 'refactor':
      return {
        generatedCode: 'high',
        originalFile: 'high',
        diffView: 'high',
        referencedFiles: 'medium'
      };
    case 'explain':
    case 'question':
    default:
      return {
        generatedCode: 'low', // N/A
        originalFile: 'low', // N/A
        diffView: 'low', // N/A
        referencedFiles: 'high'
      };
  }
};

const getDefaultSectionState = (
  intent: IntentType, 
  dataAvailability: DataAvailability
): SectionState => {
  const priorities = getSectionPriorities(intent);
  
  return {
    generatedCode: dataAvailability.hasGeneratedCode && priorities.generatedCode === 'high',
    originalFile: dataAvailability.hasOriginalFile && priorities.originalFile === 'high',
    diffView: dataAvailability.hasDiffView && priorities.diffView === 'high',
    referencedFiles: dataAvailability.hasReferencedFiles && priorities.referencedFiles === 'high'
  };
};

interface UseSectionManagerProps {
  intent: IntentType;
  sectionData: SectionData;
}

export const useSectionManager = ({ intent, sectionData }: UseSectionManagerProps) => {
  const dataAvailability = useMemo((): DataAvailability => ({
    hasGeneratedCode: !!sectionData?.generatedCode,
    hasOriginalFile: !!sectionData?.originalFile,
    hasDiffView: !!sectionData?.diffView,
    hasReferencedFiles: (sectionData?.referencedFiles?.length || 0) > 0
  }), [sectionData]);

  const priorities = useMemo(() => getSectionPriorities(intent), [intent]);
  
  const [sectionState, setSectionState] = useState<SectionState>(() => 
    getDefaultSectionState(intent, dataAvailability)
  );

  const toggleSection = useCallback((section: keyof SectionState) => {
    setSectionState(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const openSection = useCallback((section: keyof SectionState) => {
    setSectionState(prev => ({
      ...prev,
      [section]: true
    }));
  }, []);

  const closeSection = useCallback((section: keyof SectionState) => {
    setSectionState(prev => ({
      ...prev,
      [section]: false
    }));
  }, []);

  const closeAllSections = useCallback(() => {
    setSectionState({
      generatedCode: false,
      originalFile: false,
      diffView: false,
      referencedFiles: false
    });
  }, []);

  const openAllSections = useCallback(() => {
    setSectionState({
      generatedCode: dataAvailability.hasGeneratedCode,
      originalFile: dataAvailability.hasOriginalFile,
      diffView: dataAvailability.hasDiffView,
      referencedFiles: dataAvailability.hasReferencedFiles
    });
  }, [dataAvailability]);

  const resetToDefaults = useCallback(() => {
    setSectionState(getDefaultSectionState(intent, dataAvailability));
  }, [intent, dataAvailability]);

  return {
    sectionState,
    priorities,
    dataAvailability,
    toggleSection,
    openSection,
    closeSection,
    closeAllSections,
    openAllSections,
    resetToDefaults
  };
};