// src/app/(protected)/qa/components/code-reference/code-reference-wrapper.tsx
// Replace the existing file with this enhanced version

'use client'

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getLanguageFromFileName, cleanSourceCode } from '@/utils/code/language-utils';
import { SyntaxHighlighter, customCodeStyle } from '@/utils/code/syntax-highlight-config';
import MDEditor from '@uiw/react-md-editor';
import { 
  FileText, 
  Code, 
  Sparkles, 
  Zap, 
  Search, 
  Bug, 
  Lightbulb, 
  Copy, 
  Download 
} from 'lucide-react';
import { toast } from 'sonner';

// Enhanced types
interface EnhancedFileReference {
  fileName: string;
  sourceCode: string;
  summary?: string;
  fileType: 'original' | 'generated' | 'improved' | 'reviewed' | 'debug_target' | 'debug_solution' | 'explanation' | 'summary';
  isGenerated: boolean;
}

interface FileReference {
  fileName: string;
  sourceCode: string;
  summary?: string;
}

interface CodeReferenceWrapperProps {
  filesReferences: FileReference[];
  className?: string;
}

// Enhanced CodeReferenceWrapper component with syntax highlighting and file type detection
const CodeReferenceWrapper = React.forwardRef<{ activeFileIndex: number }, CodeReferenceWrapperProps>((props, ref) => {
  // Store the active file both as the fileName and the index
  const [activeFile, setActiveFile] = useState('');
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  
  // Enhanced file processing with type detection

  const determineFileType = (fileName: string): EnhancedFileReference['fileType'] => {
    if (fileName.includes('generated-')) return 'generated';
    if (fileName.includes('improved-')) return 'improved';
    if (fileName.includes('reviewed-')) return 'reviewed';
    if (fileName.includes('debug-target-')) return 'debug_target';
    if (fileName.includes('debug-solution-')) return 'debug_solution';
    if (fileName.includes('explanation-') || fileName.includes('explained-')) return 'explanation';
    if (fileName.includes('summary-') || fileName.includes('analysis-')) return 'summary';
    return 'original';
  };
  
  const isGeneratedFile = (fileType: EnhancedFileReference['fileType']): boolean => {
    return ['generated', 'improved', 'debug_solution', 'explanation', 'summary'].includes(fileType);
  };
  
  const enhancedFiles = useMemo(() => {
    if (!props.filesReferences || props.filesReferences.length === 0) return [];

    return props.filesReferences.map((file, index): EnhancedFileReference => {
      const fileName = file.fileName;
      const fileType = determineFileType(fileName);
      const isGenerated = isGeneratedFile(fileType);

      return {
        fileName,
        sourceCode: file.sourceCode,
        summary: file.summary,
        fileType,
        isGenerated
      };
    });
  }, [props.filesReferences]);

  


  const getFileTypeIcon = (fileType: EnhancedFileReference['fileType']) => {
    switch (fileType) {
      case 'generated': return <Sparkles className="h-3 w-3 text-green-400" />;
      case 'improved': return <Zap className="h-3 w-3 text-blue-400" />;
      case 'reviewed': return <Search className="h-3 w-3 text-purple-400" />;
      case 'debug_target': return <Bug className="h-3 w-3 text-red-400" />;
      case 'debug_solution': return <Bug className="h-3 w-3 text-green-400" />;
      case 'explanation': return <Lightbulb className="h-3 w-3 text-yellow-400" />;
      case 'summary': return <FileText className="h-3 w-3 text-indigo-400" />;
      default: return <FileText className="h-3 w-3 text-white/60" />;
    }
  };

  const getFileTypeLabel = (fileType: EnhancedFileReference['fileType']) => {
    switch (fileType) {
      case 'generated': return 'Generated';
      case 'improved': return 'Improved';
      case 'reviewed': return 'Reviewed';
      case 'debug_target': return 'Debug Target';
      case 'debug_solution': return 'Debug Solution';
      case 'explanation': return 'Explanation';
      case 'summary': return 'Summary';
      default: return 'Original';
    }
  };

  const getFileTypeColor = (fileType: EnhancedFileReference['fileType']) => {
    switch (fileType) {
      case 'generated': return 'border-green-500/30 text-green-300 bg-green-500/10';
      case 'improved': return 'border-blue-500/30 text-blue-300 bg-blue-500/10';
      case 'reviewed': return 'border-purple-500/30 text-purple-300 bg-purple-500/10';
      case 'debug_target': return 'border-red-500/30 text-red-300 bg-red-500/10';
      case 'debug_solution': return 'border-green-500/30 text-green-300 bg-green-500/10';
      case 'explanation': return 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10';
      case 'summary': return 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10';
      default: return 'border-white/20 text-white/60 bg-white/5';
    }
  };

  // Group files for better organization
  const groupedFiles = enhancedFiles.reduce((groups, file) => {
    const key = file.isGenerated ? 'generated' : 'original';
    if (!groups[key]) groups[key] = [];
    groups[key].push(file);
    return groups;
  }, {} as Record<string, EnhancedFileReference[]>);

  // Update both the active file name and index when changing tabs
  const handleFileChange = (fileName: string, index: number) => {
    setActiveFile(fileName);
    setActiveFileIndex(index);
  };
  
  // Expose the active file index to the parent via ref
  React.useImperativeHandle(ref, () => ({
    activeFileIndex
  }));

  // Set initial active file
  React.useEffect(() => {
    if (enhancedFiles.length > 0 && !activeFile) {
      setActiveFile(enhancedFiles[0].fileName);
      setActiveFileIndex(0);
    }
  }, [enhancedFiles, activeFile]);

  const copyToClipboard = (content: string, fileName: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${fileName} copied to clipboard`);
  };

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${fileName} downloaded`);
  };
  
  if (enhancedFiles.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center text-white/60">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No file references available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Enhanced header with file type summary */}
      {Object.keys(groupedFiles).length > 1 && (
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <div className="flex gap-3 text-xs">
            {groupedFiles.generated && (
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-green-400" />
                <span className="text-green-300">
                  {groupedFiles.generated.length} Generated
                </span>
              </div>
            )}
            {groupedFiles.original && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-white/60" />
                <span className="text-white/70">
                  {groupedFiles.original.length} Referenced
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced file tabs */}
      <div className="flex items-center overflow-x-auto pb-2 mb-2 custom-scrollbar-x flex-shrink-0">
        {enhancedFiles.map((file, index) => (
          <button
            key={file.fileName}
            onClick={() => handleFileChange(file.fileName, index)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap mr-2 flex items-center gap-2 ${
              activeFile === file.fileName 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {getFileTypeIcon(file.fileType)}
            <span>{file.fileName.split('/').pop()}</span>
            <Badge className={`text-xs px-1 py-0 ${getFileTypeColor(file.fileType)}`}>
              {getFileTypeLabel(file.fileType)}
            </Badge>
            {file.isGenerated && (
              <Badge className="text-xs px-1 py-0 border-green-500/30 text-green-300 bg-green-500/10">
                AI
              </Badge>
            )}
          </button>
        ))}
      </div>
      
      {/* Enhanced file content */}
      <div className="flex-1 overflow-hidden">
        {enhancedFiles.map((file) => {
          if (file.fileName !== activeFile) return null;
          
          const language = getLanguageFromFileName(file.fileName);
          const isLargeFile = file.sourceCode && file.sourceCode.length > 10000;
          const isMarkdown = file.fileName.endsWith('.md');
          
          return (
            <div key={file.fileName} className="h-full flex flex-col">
              {/* Enhanced file header */}
              <div className="p-3 bg-indigo-800/40 border-b border-indigo-500/20 text-white rounded-t-md flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  {getFileTypeIcon(file.fileType)}
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
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(file.sourceCode, file.fileName)}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white"
                    title="Copy content"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(file.sourceCode, file.fileName)}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white"
                    title="Download file"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Enhanced content display */}
              <div className="flex-1 overflow-auto bg-gradient-to-br from-indigo-900/40 to-purple-900/30 backdrop-blur-sm rounded-b-md">
                {file.sourceCode ? (
                  isMarkdown ? (
                    // Render markdown files (explanations, summaries, etc.)
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
                    // Render code files with proper syntax highlighting
                    <SyntaxHighlighter 
                      language={language}
                      style={customCodeStyle}
                      showLineNumbers={true}
                      wrapLines={!isLargeFile}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        borderRadius: '0 0 0.375rem 0.375rem',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        height: '100%',
                        maxHeight: 'none',
                        overflow: 'auto',
                        background: 'rgba(30, 41, 59, 0.7)',
                      }}
                    >
                      {cleanSourceCode(file.sourceCode)}
                    </SyntaxHighlighter>
                  )
                ) : (
                  <div className="p-4 text-white/70">
                    No code content available
                  </div>
                )}
              </div>

              {/* Enhanced footer with summary */}
              {file.summary && (
                <div className="p-2 bg-indigo-900/30 border-t border-indigo-500/20 text-xs text-white/70 flex-shrink-0">
                  <span className="font-medium">Summary:</span> {file.summary}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Add display name for the forwardRef component
CodeReferenceWrapper.displayName = 'CodeReferenceWrapper';

export default CodeReferenceWrapper;