export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  size?: number;
  lastModified?: Date;
  language?: string;
  isIndexed?: boolean;
}

export interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileAction: (action: 'edit' | 'analyze' | 'improve', file: FileNode) => void;
  selectedFile?: string;
  className?: string;
}

export type FilterType = 'all' | 'code' | 'config' | 'docs';

export type FileAction = 'edit' | 'analyze' | 'improve';