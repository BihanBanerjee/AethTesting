// src/app/(protected)/dashboard/code-references/components/file-viewer.tsx
'use client';

import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DarkCodeBlock } from '@/components/ui/dark-code-block';
import MDEditor from '@uiw/react-md-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronUp, Code, FileText, Maximize2, X } from 'lucide-react';
import type { FileViewerProps } from '../types/file-reference';
import { getFileTypeIcon, getFileTypeIconProps } from '../config/file-icons';
import { getFileTypeLabel, getFileTypeColor } from '../utils/file-type-detector';
import { FileActions } from './file-actions';

export const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [showOriginalCode, setShowOriginalCode] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const IconComponent = getFileTypeIcon(file.fileType);
  const iconProps = getFileTypeIconProps(file.fileType);

  const detectLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'tsx',
      'js': 'javascript',
      'jsx': 'jsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'kt': 'kotlin',
      'swift': 'swift',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'sql': 'sql',
    };
    return languageMap[extension || ''] || 'text';
  };

  const preprocessCode = (code: string): string => {
    if (!code) return '';
    
    let processedCode = code;
    
    // Try to detect if code is JSON-stringified (double-escaped)
    if (code.startsWith('"') && code.endsWith('"')) {
      try {
        processedCode = JSON.parse(code);
      } catch (e) {
        // If JSON parse fails, continue with the original
      }
    }
    
    // Handle various line break formats
    processedCode = processedCode
      .replace(/\\n/g, '\n')         // Replace escaped \n with actual newlines
      .replace(/\\r\\n/g, '\n')      // Replace escaped \r\n with newlines  
      .replace(/\\r/g, '\n')         // Replace escaped \r with newlines
      .replace(/\\t/g, '\t')         // Replace escaped tabs with actual tabs
      .replace(/\\"/g, '"')          // Replace escaped quotes
      .replace(/\\'/g, "'")          // Replace escaped single quotes
      .replace(/\\\\/g, '\\')        // Replace double backslashes
      .trim();                       // Remove leading/trailing whitespace
    
    // Ensure proper line endings
    if (processedCode.includes('\n')) {
      processedCode = processedCode.split('\n').map(line => line.trimEnd()).join('\n');
    }
    
    return processedCode;
  };

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
      
      {/* Content area with progressive disclosure */}
      <div className="flex-1 overflow-y-auto bg-indigo-900/20 min-h-0">
        <div className="p-4 space-y-4">
          {/* Summary Section - Always Visible */}
          {file.summary && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-300" />
                <h4 className="text-sm font-semibold text-white">Summary</h4>
              </div>
              <div className="bg-blue-600/20 border border-blue-400/40 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-sm text-white leading-relaxed font-medium">
                  {file.summary}
                </p>
              </div>
            </div>
          )}

          {/* Original Code Section - Expandable */}
          {file.sourceCode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-indigo-300" />
                  <h4 className="text-sm font-semibold text-white">Original Code</h4>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullScreen(true)}
                    className="text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 h-8"
                    title="View in full screen"
                  >
                    <Maximize2 className="h-3 w-3" />
                    Full Screen
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOriginalCode(!showOriginalCode)}
                    className="text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 h-8"
                  >
                    {showOriginalCode ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Hide Code
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {showOriginalCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      exit={{ y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {file.fileName.endsWith('.md') ? (
                        // Render markdown files with dark theme
                        <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                          <MDEditor.Markdown 
                            source={preprocessCode(file.sourceCode)}
                            style={{ 
                              backgroundColor: 'transparent',
                              color: 'white'
                            }}
                          />
                        </div>
                      ) : (
                        // Render code files with beautiful syntax highlighting
                        <DarkCodeBlock
                          code={preprocessCode(file.sourceCode)}
                          language={detectLanguageFromFileName(file.fileName)}
                          filename={file.fileName}
                          showLineNumbers={true}
                        />
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview hint when collapsed */}
              {!showOriginalCode && (
                <div className="bg-gray-600/15 border border-gray-400/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/70 font-medium">
                      Click "Show Code" to view the complete source code with syntax highlighting
                    </p>
                    <Badge variant="outline" className="text-xs text-white/60 border-white/30">
                      {detectLanguageFromFileName(file.fileName)}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No content fallback */}
          {!file.sourceCode && !file.summary && (
            <div className="text-center py-8 text-white/60">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No content available for this file</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Full Screen Modal */}
      <AnimatePresence>
        {showFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowFullScreen(false)}
          >
            <div 
              className="h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 bg-black/40 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <IconComponent {...iconProps} />
                  <h2 className="text-xl font-semibold text-white">{file.fileName}</h2>
                  <Badge className={`${getFileTypeColor(file.fileType)}`}>
                    {getFileTypeLabel(file.fileType)}
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullScreen(false)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-full">
                  {file.fileName.endsWith('.md') ? (
                    <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
                      <MDEditor.Markdown 
                        source={preprocessCode(file.sourceCode)}
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'white'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-black/40 border border-white/10 rounded-lg backdrop-blur-sm overflow-hidden">
                      <SyntaxHighlighter
                        language={detectLanguageFromFileName(file.fileName)}
                        style={atomDark}
                        showLineNumbers={true}
                        customStyle={{
                          margin: 0,
                          padding: '1.5rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                        }}
                        codeTagProps={{
                          style: {
                            fontSize: '14px',
                            fontFamily: '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
                            lineHeight: '1.6',
                          }
                        }}
                        lineNumberStyle={{
                          color: 'rgba(255, 255, 255, 0.3)',
                          paddingRight: '1rem',
                          fontSize: '12px',
                          minWidth: '3em',
                        }}
                      >
                        {preprocessCode(file.sourceCode)}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TabsContent>
  );
};