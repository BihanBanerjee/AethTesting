// src/app/(protected)/dashboard/code-references.tsx - Enhanced Version
'use client';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';
import { motion } from 'framer-motion';
import { getLanguageFromFileName } from '@/utils/code/language-utils';
import CodeContent from '@/components/code/code-content';
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
  summary: string;
  fileType: 'original' | 'generated' | 'improved' | 'reviewed' | 'debug_target' | 'debug_solution' | 'explanation' | 'summary';
  isGenerated: boolean;
}

type Props = {
    filesReferences: {fileName: string; sourceCode: string; summary: string}[]
    className?: string
}

const CodeReferences = ({ filesReferences, className }: Props) => {
    const [tab, setTab] = React.useState(filesReferences[0]?.fileName || '');
    
    if (filesReferences.length === 0) {
        return null;
    }

    // Enhanced file processing with type detection
    const processFileReferences = (files: any[]): EnhancedFileReference[] => {
        return files.map(file => {
            const fileName = file.fileName;
            const fileType = determineFileType(fileName);
            const isGenerated = isGeneratedFile(fileType);

            return {
                fileName,
                sourceCode: file.sourceCode,
                summary: file.summary || `File: ${fileName}`,
                fileType,
                isGenerated
            };
        });
    };

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

    const enhancedFiles = processFileReferences(filesReferences);
    
    // Group files for better organization
    const groupedFiles = enhancedFiles.reduce((groups, file) => {
        const key = file.isGenerated ? 'generated' : 'original';
        if (!groups[key]) groups[key] = [];
        groups[key].push(file);
        return groups;
    }, {} as Record<string, EnhancedFileReference[]>);

    // Set initial tab if not set
    React.useEffect(() => {
        if (!tab && enhancedFiles.length > 0) {
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
                
                {/* File type summary */}
                {Object.keys(groupedFiles).length > 1 && (
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
                )}
            </div>
            
            <Tabs value={tab} onValueChange={setTab} className="flex flex-col max-h-[60vh] overflow-hidden">
                {/* Enhanced file tabs */}
                <div className='overflow-x-auto flex gap-2 bg-white/5 p-2 rounded-md flex-shrink-0 max-h-32 overflow-y-auto'>
                    {enhancedFiles.map((file, index) => (
                        <motion.button 
                            onClick={() => setTab(file.fileName)} 
                            key={file.fileName} 
                            className={cn('px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2', 
                            {
                                'bg-indigo-600 text-white': tab === file.fileName,
                                'text-white/70 hover:text-white hover:bg-white/10': tab !== file.fileName
                            })}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
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
                        </motion.button>
                    ))}
                </div>
                
                {/* Enhanced file content */}
                <div className="flex-1 overflow-hidden mt-2 min-h-0">
                    {enhancedFiles.map(file => (
                        <TabsContent 
                            key={file.fileName} 
                            value={file.fileName} 
                            className='w-full h-full border border-white/10 rounded-md overflow-hidden flex flex-col'
                        >
                            {/* Enhanced header */}
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
                                
                                {/* Action buttons */}
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
                    ))}
                </div>
            </Tabs>
        </motion.div>
    );
};

export default CodeReferences;