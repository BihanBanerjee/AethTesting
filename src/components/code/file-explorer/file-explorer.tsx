'use client'

import React from 'react';
import { useFileExplorer } from './hooks';
import { FileExplorerHeader } from './file-explorer-header';
import { FileTree } from './file-tree';
import type { FileExplorerProps } from './types';


export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileAction,
  selectedFile,
  className = ''
}) => {
  const {
    searchTerm,
    filterType,
    setSearchTerm,
    setFilterType,
    toggleDirectory,
    isDirectoryExpanded,
  } = useFileExplorer();


  return (
    <div className={`glassmorphism border border-white/20 rounded-lg ${className}`}>
      <FileExplorerHeader
        searchTerm={searchTerm}
        filterType={filterType}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterType}
      />

      <div className="p-2 max-h-96 overflow-y-auto">
        <FileTree
          files={files}
          selectedFile={selectedFile}
          searchTerm={searchTerm}
          filterType={filterType}
          isDirectoryExpanded={isDirectoryExpanded}
          onFileSelect={onFileSelect}
          onDirectoryToggle={toggleDirectory}
          onFileAction={onFileAction}
        />
      </div>
    </div>
  );
};