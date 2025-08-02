// src/hooks/use-project-context.ts
import useProject from '@/hooks/use-project';

/**
 * Hook for centralized project context and readiness checking
 * 
 * Responsibilities:
 * - Provide consistent project access
 * - Determine project readiness state
 * - Centralize project-related flags
 * 
 * @returns Object containing project state and readiness flags
 */
export function useProjectContext() {
  const { project } = useProject();
  
  // Comprehensive readiness check
  const isReady = !!(project?.id && project?.status);
  
  return {
    // Core project data
    project,
    
    // Readiness flags
    isReady,
    hasProject: !!project,
    hasProjectId: !!project?.id,
    
    // Project metadata (when available)
    projectId: project?.id || null,
    projectName: project?.name || null,
    projectStatus: project?.status || null,
    
    // Convenience flags for UI states
    isLoading: !project, // If project hook is still loading
    canProceed: isReady, // Alias for isReady for semantic clarity
  };
}