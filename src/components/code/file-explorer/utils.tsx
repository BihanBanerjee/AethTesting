import React from 'react';
import { 
  File, 
  Folder, 
  FolderOpen, 
  FileCode,
  FileText,
  FileImage,
} from 'lucide-react';
import type { FileNode, FilterType } from './types';

export const getFileIcon = (file: FileNode, isExpanded: boolean) => {
  if (file.type === 'directory') {
    return isExpanded ? 
      <FolderOpen className="h-4 w-4 text-blue-400" /> : 
      <Folder className="h-4 w-4 text-blue-400" />;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'rs':
    case 'go':
      return <FileCode className="h-4 w-4 text-green-400" />;
    case 'md':
    case 'txt':
    case 'doc':
      return <FileText className="h-4 w-4 text-white/60" />;
    case 'png':
    case 'jpg':
    case 'gif':
    case 'svg':
      return <FileImage className="h-4 w-4 text-purple-400" />;
    default:
      return <File className="h-4 w-4 text-white/60" />;
  }
};

export const filterFiles = (nodes: FileNode[], searchTerm: string, filterType: FilterType): FileNode[] => {
  return nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (node.type === 'directory') {
      const hasMatchingChildren = node.children && filterFiles(node.children, searchTerm, filterType).length > 0;
      return matchesSearch || hasMatchingChildren;
    }

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (filterType) {
      case 'code':
        return ['js', 'jsx', 'ts', 'tsx', 'py', 'rs', 'go', 'java', 'cpp', 'c'].includes(ext || '');
      case 'config':
        return ['json', 'yaml', 'yml', 'toml', 'env', 'config'].includes(ext || '');
      case 'docs':
        return ['md', 'txt', 'doc', 'pdf', 'readme'].includes(ext || '');
      default:
        return true;
    }
  });
};