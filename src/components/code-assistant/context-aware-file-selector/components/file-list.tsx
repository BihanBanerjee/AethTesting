'use client'

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { FileListProps } from '../types';

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFiles,
  suggestedFiles,
  onFileToggle
}) => {
  return (
    <div className="max-h-64 overflow-y-auto space-y-1">
      {files.map((file, index) => (
        <motion.div
          key={file}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.02 }}
          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
            selectedFiles.includes(file)
              ? 'bg-indigo-600/30 border border-indigo-500/50'
              : 'hover:bg-white/10'
          }`}
          onClick={() => onFileToggle(file)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-white/60" />
            <span className="text-sm text-white/80">{file}</span>
          </div>
          {suggestedFiles.includes(file) && (
            <Badge className="bg-yellow-500/20 text-yellow-200 text-xs">
              Suggested
            </Badge>
          )}
        </motion.div>
      ))}
    </div>
  );
};