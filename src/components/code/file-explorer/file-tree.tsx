'use client'

import React from 'react';
import { File } from 'lucide-react';
import { FileNodeComponent } from './file-node';
import { filterFiles } from './utils';
import type { FileNode, FileAction, FilterType } from './types';

interface FileTreeProps {
  files: FileNode[];
  selectedFile?: string;
  searchTerm: string;
  filterType: FilterType;
  isDirectoryExpanded: (path: string) => boolean;
  onFileSelect: (file: FileNode) => void;
  onDirectoryToggle: (path: string) => void;
  onFileAction: (action: FileAction, file: FileNode) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedFile,
  searchTerm,
  filterType,
  isDirectoryExpanded,
  onFileSelect,
  onDirectoryToggle,
  onFileAction
}) => {
  const filteredFiles = filterFiles(files, searchTerm, filterType);

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isSelected = selectedFile === node.path;
    const isExpanded = isDirectoryExpanded(node.path);

    return (
      <FileNodeComponent
        key={node.id}
        node={node}
        depth={depth}
        isSelected={isSelected}
        isExpanded={isExpanded}
        onSelect={onFileSelect}
        onToggle={onDirectoryToggle}
        onAction={onFileAction}
      >
        {node.children && 
          filterFiles(node.children, searchTerm, filterType).map(child => 
            renderFileNode(child, depth + 1)
          )
        }
      </FileNodeComponent>
    );
  };

  if (filteredFiles.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 group">
      {filteredFiles.map(file => renderFileNode(file))}
    </div>
  );
};