// src/app/(protected)/dashboard/code-references/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { FileReferenceProps } from './types/file-reference';
import { processFileReferences, groupFilesByType } from './utils/file-processor';
import { FileSummary } from './components/file-header';
import { FileTabs } from './components/file-tabs';
import { FileViewer } from './components/file-viewer';

const CodeReferences: React.FC<FileReferenceProps> = ({ filesReferences, className }) => {
  const [tab, setTab] = useState(filesReferences?.[0]?.fileName || '');
  
  if (!filesReferences || filesReferences.length === 0) {
    return null;
  }

  const enhancedFiles = processFileReferences(filesReferences);
  const groupedFiles = groupFilesByType(enhancedFiles);

  // Set initial tab if not set
  useEffect(() => {
    if (!tab && enhancedFiles.length > 0 && enhancedFiles[0]) {
      setTab(enhancedFiles[0].fileName);
    }
  }, [enhancedFiles, tab]);
  
  return (
    <motion.div 
      className={cn('w-full glassmorphism border border-white/20 p-4 flex flex-col', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
          Files & Code
        </h3>
        
        <FileSummary groupedFiles={groupedFiles} />
      </div>
      
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col overflow-hidden">
        <FileTabs 
          files={enhancedFiles} 
          activeTab={tab} 
          onTabChange={setTab} 
        />
        
        <div className="flex-1 overflow-y-auto mt-2 min-h-0">
          {enhancedFiles.map(file => (
            <FileViewer 
              key={file.fileName}
              file={file}
              className={className}
            />
          ))}
        </div>
      </Tabs>
    </motion.div>
  );
};

export default CodeReferences;