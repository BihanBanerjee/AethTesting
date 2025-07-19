'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { FilterType } from './types';

interface FileExplorerHeaderProps {
  searchTerm: string;
  filterType: FilterType;
  onSearchChange: (value: string) => void;
  onFilterChange: (type: FilterType) => void;
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'code', label: 'Code' },
  { value: 'config', label: 'Config' },
  { value: 'docs', label: 'Docs' },
];

export const FileExplorerHeader: React.FC<FileExplorerHeaderProps> = ({
  searchTerm,
  filterType,
  onSearchChange,
  onFilterChange
}) => {
  return (
    <div className="p-4 border-b border-white/10">
      <h3 className="text-lg font-medium text-white mb-3">Project Files</h3>
      
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>
        
        <div className="flex gap-2">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              variant={filterType === value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(value)}
              className={`text-xs ${
                filterType === value 
                  ? 'bg-indigo-600 text-white' 
                  : 'border-white/20 text-white/70 hover:bg-white/10'
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};