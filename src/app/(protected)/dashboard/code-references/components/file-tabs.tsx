// src/app/(protected)/dashboard/code-references/components/file-tabs.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FileTabsProps } from '../types/file-reference';
import { getFileTypeIcon, getFileTypeIconProps } from '../config/file-icons';
import { getFileTypeLabel, getFileTypeColor } from '../utils/file-type-detector';

export const FileTabs: React.FC<FileTabsProps> = ({ files, activeTab, onTabChange }) => {
  return (
    <div className='overflow-x-auto flex gap-2 bg-white/5 p-2 rounded-md flex-shrink-0 max-h-32 overflow-y-auto'>
      {files.map((file, index) => {
        const IconComponent = getFileTypeIcon(file.fileType);
        const iconProps = getFileTypeIconProps(file.fileType);
        
        return (
          <motion.button 
            onClick={() => onTabChange(file.fileName)} 
            key={file.fileName} 
            className={cn('px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2', 
            {
              'bg-indigo-600 text-white': activeTab === file.fileName,
              'text-white/70 hover:text-white hover:bg-white/10': activeTab !== file.fileName
            })}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <IconComponent {...iconProps} />
            <span>{file.fileName.split('/').pop()}</span>
            <Badge className={`text-xs px-1 py-0 ${getFileTypeColor(file.fileType)}`}>
              {getFileTypeLabel(file.fileType)}
            </Badge>
            {file.isGenerated && (
              <Badge className="text-xs px-1 py-0 border-green-500/30 text-green-300 bg-green-500/10">
                AI
              </Badge>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};