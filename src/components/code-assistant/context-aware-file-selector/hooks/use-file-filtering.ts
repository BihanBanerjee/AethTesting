'use client'

import { useState, useEffect } from 'react';
import { filterFilesBySearch } from '../utils/intent-file-mapping';

export const useFileFiltering = (availableFiles: string[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<string[]>(availableFiles);

  useEffect(() => {
    const filtered = filterFilesBySearch(availableFiles, searchTerm);
    setFilteredFiles(filtered);
  }, [searchTerm, availableFiles]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredFiles,
    clearSearch
  };
};