// src/hooks/use-project-files.ts
import { useMemo } from 'react';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';

/**
 * Hook for managing project file data and state
 * 
 * Responsibilities:
 * - Fetch project files from API
 * - Manage loading states
 * - Handle file-related errors
 * - Return formatted file list
 * 
 * @returns Object containing project files and loading state
 */
export function useProjectFiles() {
  const { project } = useProject();
  
  const { 
    data: projectFiles, 
    isLoading, 
    error 
  } = api.project.getProjectFiles.useQuery(
    { projectId: project?.id || '' },
    { 
      enabled: !!project?.id,
      retry: 2,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
  
  // Extract file names for easy consumption - memoize to prevent unnecessary re-renders
  const fileNames = useMemo(() => 
    projectFiles?.map(f => f.fileName) || [], 
    [projectFiles]
  );
  
  return {
    // Raw project files data
    projectFiles: projectFiles || [],
    
    // Formatted file names array
    fileNames,
    
    // Loading states
    isLoading: isLoading && !!project?.id,
    
    // Error state
    error,
    
    // Convenience flags
    hasFiles: fileNames.length > 0,
    isEmpty: !isLoading && fileNames.length === 0,
  };
}