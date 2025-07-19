'use client'

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { FileSearchProps } from '../types';

export const FileSearch: React.FC<FileSearchProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
      <Input
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 bg-white/10 border-white/20 text-white"
      />
    </div>
  );
};