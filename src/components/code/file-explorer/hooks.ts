'use client'

import { useState } from 'react';
import type { FilterType } from './types';

export const useFileExplorer = () => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const isDirectoryExpanded = (path: string) => {
    return expandedDirs.has(path);
  };

  return {
    expandedDirs,
    searchTerm,
    filterType,
    setSearchTerm,
    setFilterType,
    toggleDirectory,
    isDirectoryExpanded,
  };
};