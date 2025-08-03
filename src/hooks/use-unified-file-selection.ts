// src/hooks/use-unified-file-selection.ts
import { useState, useCallback, useMemo } from 'react';
import { useProjectFiles } from './use-project-files';

/**
 * Unified file selection hook for all pages (dashboard, qa, code-assistant)
 * Consolidates file selection logic that was duplicated across components
 * 
 * Features:
 * - Consistent file state management
 * - Integration with project files hook
 * - Helper methods for file manipulation
 * - Type-safe file operations
 */
export function useUnifiedFileSelection() {
  const { fileNames: availableFiles, isLoading: loadingFiles } = useProjectFiles();
  
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Memoized helper functions
  const fileHelpers = useMemo(() => ({
    // Add file to selection if not already selected
    addFile: (fileName: string) => {
      setSelectedFiles(prev => 
        prev.includes(fileName) ? prev : [...prev, fileName]
      );
    },
    
    // Remove file from selection
    removeFile: (fileName: string) => {
      setSelectedFiles(prev => prev.filter(f => f !== fileName));
    },
    
    // Toggle file selection
    toggleFile: (fileName: string) => {
      setSelectedFiles(prev => 
        prev.includes(fileName) 
          ? prev.filter(f => f !== fileName)
          : [...prev, fileName]
      );
    },
    
    // Clear all selected files
    clearSelection: () => {
      setSelectedFiles([]);
    },
    
    // Select all available files
    selectAll: () => {
      setSelectedFiles([...availableFiles]);
    },
    
    // Check if file is selected
    isSelected: (fileName: string): boolean => {
      return selectedFiles.includes(fileName);
    },
    
    // Set files from external source (e.g., restored state)
    setFiles: (files: string[]) => {
      // Filter to only include available files
      const validFiles = files.filter(file => availableFiles.includes(file));
      setSelectedFiles(validFiles);
    }
  }), [selectedFiles, availableFiles]);
  
  // Validation functions
  const validation = useMemo(() => ({
    hasSelection: selectedFiles.length > 0,
    hasAvailableFiles: availableFiles.length > 0,
    isValidSelection: selectedFiles.every(file => availableFiles.includes(file)),
    selectionCount: selectedFiles.length,
    availableCount: availableFiles.length,
    isAllSelected: selectedFiles.length === availableFiles.length && availableFiles.length > 0
  }), [selectedFiles, availableFiles]);
  
  // Context files for API calls (with fallback to all available files)
  const contextFiles = useMemo(() => 
    selectedFiles.length > 0 ? selectedFiles : availableFiles,
    [selectedFiles, availableFiles]
  );
  
  return {
    // Core state
    selectedFiles,
    availableFiles,
    contextFiles,
    
    // Loading state
    isLoading: loadingFiles,
    
    // Helper functions
    ...fileHelpers,
    
    // Validation
    ...validation,
    
    // Raw setters for advanced usage
    setSelectedFiles,
  };
}