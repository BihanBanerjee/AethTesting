// src/app/(protected)/dashboard/code-references/components/file-viewer.tsx
'use client';

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getLanguageFromFileName } from '@/utils/code/language-utils';
import { CodeContent } from '@/components/code/code-viewer';
import MDEditor from '@uiw/react-md-editor';
import type { FileViewerProps } from '../types/file-reference';
import { getFileTypeIcon, getFileTypeIconProps } from '../config/file-icons';
import { getFileTypeLabel, getFileTypeColor } from '../utils/file-type-detector';
import { FileActions } from './file-actions';

export const FileViewer: React.FC<FileViewerProps> = ({ file, className }) => {
  const IconComponent = getFileTypeIcon(file.fileType);
  const iconProps = getFileTypeIconProps(file.fileType);

  return (
    <TabsContent 
      key={file.fileName} 
      value={file.fileName} 
      className='w-full h-full border border-white/10 rounded-md overflow-hidden flex flex-col'
    >
      {/* Enhanced header */}
      <div className="p-3 bg-indigo-800/40 border-b border-indigo-500/20 text-white rounded-t-md flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <IconComponent {...iconProps} />
          <span className="font-medium">{file.fileName}</span>
          <Badge className={`text-xs px-2 py-1 ${getFileTypeColor(file.fileType)}`}>
            {getFileTypeLabel(file.fileType)}
          </Badge>
          {file.isGenerated && (
            <Badge className="text-xs px-2 py-1 border-green-500/30 text-green-300 bg-green-500/10">
              AI Generated
            </Badge>
          )}
        </div>
        
        <FileActions file={file} />
      </div>
      
      {/* Enhanced content display */}
      <div className="flex-1 overflow-y-auto bg-indigo-900/20 max-h-96 min-h-0">
        {file.sourceCode ? (
          file.fileName.endsWith('.md') ? (
            // Render markdown files
            <div className="p-4">
              <MDEditor.Markdown 
                source={file.sourceCode}
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'white'
                }}
              />
            </div>
          ) : (
            // Render code files
            <CodeContent 
              sourceCode={file.sourceCode}
              language={getLanguageFromFileName(file.fileName)}
              customStyle={{
                borderRadius: '0',
                background: 'transparent',
                margin: 0,
                fontSize: '0.875rem'
              }}
            />
          )
        ) : (
          <div className="p-4 text-white/70">
            No content available
          </div>
        )}
      </div>
      
      {/* Enhanced footer with summary */}
      {file.summary && (
        <div className="p-2 bg-indigo-900/30 border-t border-indigo-500/20 text-xs text-white/70 flex-shrink-0">
          <span className="font-medium">Summary:</span> {file.summary}
        </div>
      )}
    </TabsContent>
  );
};