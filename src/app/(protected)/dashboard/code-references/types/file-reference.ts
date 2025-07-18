// src/app/(protected)/dashboard/code-references/types/file-reference.ts
export interface EnhancedFileReference {
  fileName: string;
  sourceCode: string;
  summary: string;
  fileType: 'original' | 'generated' | 'improved' | 'reviewed' | 'debug_target' | 'debug_solution' | 'explanation' | 'summary';
  isGenerated: boolean;
}

export interface FileReferenceProps {
  filesReferences: {
    fileName: string;
    sourceCode: string;
    summary: string;
  }[];
  className?: string;
}

export type FileType = EnhancedFileReference['fileType'];

export interface FileDisplayProps {
  file: EnhancedFileReference;
  isActive: boolean;
  onSelect: (fileName: string) => void;
}

export interface FileTabsProps {
  files: EnhancedFileReference[];
  activeTab: string;
  onTabChange: (fileName: string) => void;
}

export interface FileViewerProps {
  file: EnhancedFileReference;
  className?: string;
}

export interface FileHeaderProps {
  file: EnhancedFileReference;
}

export interface FileActionsProps {
  file: EnhancedFileReference;
}