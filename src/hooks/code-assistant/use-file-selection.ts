'use client'

import { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';
import type { FileSelectionState } from '../types/use-code-assistant.types';

export function useFileSelection(): FileSelectionState {
  const { project } = useProject();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  // Get available files
  const { data: projectFiles } = api.project.getProjectFiles?.useQuery(
    { projectId: project?.id || '' },
    { 
      enabled: !!project?.id,
    }
  );

  useEffect(() => {
    if (projectFiles) {
      setAvailableFiles(projectFiles.map(f => f.fileName) || []);
    }
  }, [projectFiles]);

  return {
    selectedFiles,
    setSelectedFiles,
    availableFiles
  };
}