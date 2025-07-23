'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSectionManager } from '@/hooks/use-section-manager';
import { processResponseData, validateSectionData } from '@/lib/section-data-processor';
import {
  GeneratedCodeSection,
  OriginalFileSection,
  DiffViewSection,
  ReferencedFilesSection
} from '@/components/ui/collapsible-sections/sections';
import type { 
  EnhancedResponse, 
  SectionData,
  IntentType
} from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface CodeContextTabProps {
  response: EnhancedResponse;
  projectId?: string;
  className?: string;
}

export const CodeContextTab: React.FC<CodeContextTabProps> = ({
  response,
  projectId,
  className
}) => {
  const [sectionData, setSectionData] = useState<SectionData>({
    referencedFiles: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always initialize section manager with default data
  const sectionManager = useSectionManager({
    intent: response.intent.type as IntentType,
    sectionData
  });

  // Process response data on mount
  useEffect(() => {
    const processData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const processed = await processResponseData(response, projectId);
        
        if (!validateSectionData(processed)) {
          throw new Error('Invalid section data structure');
        }
        
        setSectionData(processed);
      } catch (err) {
        console.error('Failed to process section data:', err);
        setError('Failed to load section data');
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [response, projectId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white/60">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Loader2 className="h-8 w-8 mx-auto text-indigo-400" />
          </motion.div>
          <p className="text-sm">Processing response data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white/60">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const {
    sectionState,
    priorities,
    dataAvailability,
    toggleSection,
    closeAllSections,
    openAllSections,
    resetToDefaults
  } = sectionManager;

  // Check if we have any sections to show
  const hasAnySections = dataAvailability.hasGeneratedCode || 
                        dataAvailability.hasOriginalFile || 
                        dataAvailability.hasDiffView || 
                        dataAvailability.hasReferencedFiles;

  if (!hasAnySections) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white/60">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-lg font-medium">No additional context</p>
          <p className="text-sm mt-2">This response doesn't include code or file references</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Section Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div className="text-sm text-white/60">
          <span className="font-medium">
            {Object.values(sectionState).filter(Boolean).length} of{' '}
            {Object.values(dataAvailability).filter(Boolean).length} sections expanded
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
          >
            <Settings2 className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeAllSections}
            className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
          >
            <span className="sm:hidden">−</span>
            <span className="hidden sm:inline">Collapse All</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openAllSections}
            className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
          >
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">Expand All</span>
          </Button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Generated Code Section */}
        {sectionData.generatedCode && (
          <GeneratedCodeSection
            codeData={sectionData.generatedCode}
            isOpen={sectionState.generatedCode}
            onToggle={() => toggleSection('generatedCode')}
            priority={priorities.generatedCode}
          />
        )}

        {/* Diff View Section */}
        {sectionData.diffView && (
          <DiffViewSection
            diffData={sectionData.diffView}
            isOpen={sectionState.diffView}
            onToggle={() => toggleSection('diffView')}
            priority={priorities.diffView}
          />
        )}

        {/* Original File Section */}
        {sectionData.originalFile && (
          <OriginalFileSection
            fileData={sectionData.originalFile}
            isOpen={sectionState.originalFile}
            onToggle={() => toggleSection('originalFile')}
            priority={priorities.originalFile}
          />
        )}

        {/* Referenced Files Section */}
        {sectionData.referencedFiles.length > 0 && (
          <ReferencedFilesSection
            filesReferences={sectionData.referencedFiles}
            isOpen={sectionState.referencedFiles}
            onToggle={() => toggleSection('referencedFiles')}
            priority={priorities.referencedFiles}
          />
        )}
      </div>
    </div>
  );
};