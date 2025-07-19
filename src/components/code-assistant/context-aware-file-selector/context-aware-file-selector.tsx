'use client'

import React from 'react';
import { useFileSuggestions } from './hooks/use-file-suggestions';
import { useFileFiltering } from './hooks/use-file-filtering';
import { FileSearch } from './components/file-search';
import { SuggestedFilesPanel } from './components/suggested-files-panel';
import { SelectedFilesPanel } from './components/selected-files-panel';
import { FileList } from './components/file-list';
import type { ContextAwareFileSelectorProps } from './types';

export const ContextAwareFileSelector: React.FC<ContextAwareFileSelectorProps> = ({
  availableFiles,
  selectedFiles,
  onFileSelectionChange,
  currentQuery
}) => {
  const { suggestedFiles } = useFileSuggestions(currentQuery, availableFiles);
  const { searchTerm, setSearchTerm, filteredFiles } = useFileFiltering(availableFiles);

  const handleFileToggle = (file: string) => {
    if (selectedFiles.includes(file)) {
      onFileSelectionChange(selectedFiles.filter(f => f !== file));
    } else {
      onFileSelectionChange([...selectedFiles, file]);
    }
  };

  const handleSuggestedFilesSelect = () => {
    const newSelection = [...new Set([...selectedFiles, ...suggestedFiles])];
    onFileSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    onFileSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      <FileSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <SuggestedFilesPanel
        suggestedFiles={suggestedFiles}
        currentQuery={currentQuery}
        onFileToggle={handleFileToggle}
        onSelectAll={handleSuggestedFilesSelect}
      />

      <SelectedFilesPanel
        selectedFiles={selectedFiles}
        onFileToggle={handleFileToggle}
        onClearAll={handleClearAll}
      />

      <FileList
        files={filteredFiles}
        selectedFiles={selectedFiles}
        suggestedFiles={suggestedFiles}
        onFileToggle={handleFileToggle}
      />
    </div>
  );
};