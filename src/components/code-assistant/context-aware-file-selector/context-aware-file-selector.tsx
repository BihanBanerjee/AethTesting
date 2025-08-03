'use client'

import React, { useState, useCallback } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const { suggestedFiles } = useFileSuggestions(currentQuery, availableFiles);
  const { searchTerm, setSearchTerm, filteredFiles } = useFileFiltering(availableFiles);

  const handleFileToggle = useCallback((file: string) => {
    if (selectedFiles.includes(file)) {
      onFileSelectionChange(selectedFiles.filter(f => f !== file));
    } else {
      onFileSelectionChange([...selectedFiles, file]);
    }
  }, [selectedFiles, onFileSelectionChange]);

  const handleSuggestedFilesSelect = useCallback(() => {
    const newSelection = [...new Set([...selectedFiles, ...suggestedFiles])];
    onFileSelectionChange(newSelection);
  }, [selectedFiles, suggestedFiles, onFileSelectionChange]);

  const handleClearAll = useCallback(() => {
    onFileSelectionChange([]);
  }, [onFileSelectionChange]);

  const handleSearchFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    // Only collapse if no files are selected and search is empty
    // Add a small delay to prevent immediate collapse when clicking on file items
    setTimeout(() => {
      if (selectedFiles.length === 0 && !searchTerm.trim()) {
        setIsExpanded(false);
      }
    }, 150);
  }, [selectedFiles.length, searchTerm]);

  const placeholder = selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Search files...";

  return (
    <div className="space-y-4">
      <FileSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        placeholder={placeholder}
      />

      {isExpanded && (
        <>
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
        </>
      )}
    </div>
  );
};
