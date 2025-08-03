// src/hooks/use-unified-file-selection.ts
import { useState, useCallback } from 'react';
import { useProjectFiles } from './use-project-files';

/**
 * Simplified file selection hook for dashboard
 * Provides basic file selection state management
 */
export function useUnifiedFileSelection() {
  const { fileNames: availableFiles, isLoading: loadingFiles } = useProjectFiles();
  
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Clear all selected files
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);
  
  
  
  return {
    // Core state
    selectedFiles,
    availableFiles,
    
    // Loading state
    isLoading: loadingFiles,
    
    // Helper functions
    clearSelection,
    
    // Raw setters for advanced usage
    setSelectedFiles,
  };
}