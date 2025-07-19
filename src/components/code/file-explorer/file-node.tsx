'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFileIcon } from './utils';
import type { FileNode, FileAction } from './types';

interface FileNodeProps {
  node: FileNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (file: FileNode) => void;
  onToggle: (path: string) => void;
  onAction: (action: FileAction, file: FileNode) => void;
  children?: React.ReactNode;
}

export const FileNodeComponent: React.FC<FileNodeProps> = ({
  node,
  depth,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  onAction,
  children
}) => {
  const handleClick = () => {
    if (node.type === 'directory') {
      onToggle(node.path);
    } else {
      onSelect(node);
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: FileAction) => {
    e.stopPropagation();
    onAction(action, node);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-2 px-2 py-1 hover:bg-white/5 cursor-pointer rounded transition-colors group ${
          isSelected ? 'bg-indigo-600/20 border-l-2 border-indigo-500' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {getFileIcon(node, isExpanded)}
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
              onClick={(e) => handleActionClick(e, 'analyze')}
            >
              <Search className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => handleActionClick(e, 'improve')}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {node.type === 'directory' && isExpanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};