// src/components/code/file-explorer.tsx
'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Search, 
  Filter,
  FileCode,
  FileText,
  FileImage,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileNode {
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

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileAction: (action: 'edit' | 'analyze' | 'improve', file: FileNode) => void;
  selectedFile?: string;
  className?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileAction,
  selectedFile,
  className = ''
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'code' | 'config' | 'docs'>('all');

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedDirs.has(file.path) ? 
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

  const filterFiles = (nodes: FileNode[]): FileNode[] => {
    return nodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (node.type === 'directory') {
        const hasMatchingChildren = node.children && filterFiles(node.children).length > 0;
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

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isSelected = selectedFile === node.path;
    const isExpanded = expandedDirs.has(node.path);

    return (
      <div key={node.id}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-2 px-2 py-1 hover:bg-white/5 cursor-pointer rounded transition-colors ${
            isSelected ? 'bg-indigo-600/20 border-l-2 border-indigo-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node.path);
            } else {
              onFileSelect(node);
            }
          }}
        >
          {getFileIcon(node)}
          <span className="text-sm text-white/90 flex-1 truncate">
            {node.name}
          </span>
          
          {node.isIndexed && (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">
              Indexed
            </Badge>
          )}
          
          {node.type === 'file' && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileAction('analyze', node);
                }}
              >
                <Search className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileAction('improve', node);
                }}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {node.type === 'directory' && isExpanded && node.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {filterFiles(node.children).map(child => 
                renderFileNode(child, depth + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const filteredFiles = filterFiles(files);

  return (
    <div className={`glassmorphism border border-white/20 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-medium text-white mb-3">Project Files</h3>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'code', 'config', 'docs'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type as any)}
                className={`text-xs ${
                  filterType === type 
                    ? 'bg-indigo-600 text-white' 
                    : 'border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-1 group">
            {filteredFiles.map(file => renderFileNode(file))}
          </div>
        )}
      </div>
    </div>
  );
};