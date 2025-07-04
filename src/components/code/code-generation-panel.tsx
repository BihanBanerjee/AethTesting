// src/components/code/code-generation-panel.tsx
'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, FileText, Zap, Settings2, Sparkles, Code2, FileCode, GitBranch } from 'lucide-react';
import { CodeBlock, DiffViewer } from './enhanced-code-block';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerationRequest {
  type: 'improvement' | 'feature' | 'fix' | 'refactor' | 'generate';
  prompt: string;
  targetFile?: string;
  context?: string[];
  language?: string;
  framework?: string;
}

interface GenerationResult {
  id: string;
  type: GenerationRequest['type'];
  originalCode?: string;
  generatedCode: string;
  explanation: string;
  filename: string;
  language: string;
  confidence: number;
  suggestions: Array<{
    id: string;
    line: number;
    type: 'performance' | 'security' | 'style' | 'bug';
    message: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
}

interface CodeGenerationPanelProps {
  projectId: string;
  availableFiles: string[];
  onGenerate: (request: GenerationRequest) => Promise<GenerationResult>;
  onApplyChanges: (result: GenerationResult) => Promise<void>;
}

export const CodeGenerationPanel: React.FC<CodeGenerationPanelProps> = ({
  projectId,
  availableFiles,
  onGenerate,
  onApplyChanges
}) => {
  const [request, setRequest] = useState<GenerationRequest>({
    type: 'improvement',
    prompt: '',
    context: [],
    language: 'typescript'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeResult, setActiveResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!request.prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await onGenerate(request);
      setResults(prev => [result, ...prev]);
      setActiveResult(result.id);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async (result: GenerationResult) => {
    try {
      await onApplyChanges(result);
    } catch (error) {
      console.error('Failed to apply changes:', error);
    }
  };

  const getTypeIcon = (type: GenerationRequest['type']) => {
    switch (type) {
      case 'improvement': return <Sparkles className="h-4 w-4" />;
      case 'feature': return <Code2 className="h-4 w-4" />;
      case 'fix': return <Zap className="h-4 w-4" />;
      case 'refactor': return <GitBranch className="h-4 w-4" />;
      case 'generate': return <FileCode className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: GenerationRequest['type']) => {
    switch (type) {
      case 'improvement': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
      case 'feature': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'fix': return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'refactor': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'generate': return 'bg-green-500/20 text-green-200 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Panel - Generation Input */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wand2 className="h-5 w-5" />
            AI Code Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Request Type
              </label>
              <Select
                value={request.type}
                onValueChange={(value) => setRequest(prev => ({ 
                  ...prev, 
                  type: value as GenerationRequest['type'] 
                }))}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="improvement">Code Improvement</SelectItem>
                  <SelectItem value="feature">New Feature</SelectItem>
                  <SelectItem value="fix">Bug Fix</SelectItem>
                  <SelectItem value="refactor">Refactoring</SelectItem>
                  <SelectItem value="generate">Generate File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Target File (Optional)
              </label>
              <Select
                value={request.targetFile || ''}
                onValueChange={(value) => setRequest(prev => ({ 
                  ...prev, 
                  targetFile: value || undefined 
                }))}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select file..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific file</SelectItem>
                  {availableFiles.map(file => (
                    <SelectItem key={file} value={file}>{file}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Describe what you want to achieve
            </label>
            <Textarea
              value={request.prompt}
              onChange={(e) => setRequest(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="e.g., 'Add error handling to the login function' or 'Create a new React component for user profiles'"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Language
              </label>
              <Select
                value={request.language}
                onValueChange={(value) => setRequest(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Framework (Optional)
              </label>
              <Select
                value={request.framework || ''}
                onValueChange={(value) => setRequest(prev => ({ 
                  ...prev, 
                  framework: value || undefined 
                }))}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select framework..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No framework</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="nextjs">Next.js</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="fastapi">FastAPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !request.prompt.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Settings2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Right Panel - Results */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span>Generated Results</span>
            {results.length > 0 && (
              <Badge variant="outline" className="border-white/20 text-white/60">
                {results.length} results
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {results.length === 0 ? (
            <div className="p-6 text-center text-white/60">
              <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No code generated yet. Start by describing what you want to build!</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`border-b border-white/10 last:border-b-0 ${
                    activeResult === result.id ? 'bg-white/5' : ''
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setActiveResult(activeResult === result.id ? null : result.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(result.type)}`}
                        >
                          {getTypeIcon(result.type)}
                          {result.type}
                        </Badge>
                        <span className="text-sm font-medium text-white">
                          {result.filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            result.confidence >= 80 ? 'border-green-500/30 text-green-200' :
                            result.confidence >= 60 ? 'border-yellow-500/30 text-yellow-200' :
                            'border-red-500/30 text-red-200'
                          }`}
                        >
                          {result.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-white/70 line-clamp-2">
                      {result.explanation}
                    </p>
                  </div>

                  <AnimatePresence>
                    {activeResult === result.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0">
                          <Tabs defaultValue="code" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="code">Generated Code</TabsTrigger>
                              {result.originalCode && (
                                <TabsTrigger value="diff">Diff View</TabsTrigger>
                              )}
                              <TabsTrigger value="explanation">Explanation</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="code" className="mt-4">
                              <CodeBlock
                                code={result.generatedCode}
                                language={result.language}
                                filename={result.filename}
                                suggestions={result.suggestions}
                                actions={{
                                  copy: true,
                                  download: true,
                                  apply: true
                                }}
                                onApply={() => handleApply(result)}
                              />
                            </TabsContent>
                            
                            {result.originalCode && (
                              <TabsContent value="diff" className="mt-4">
                                <DiffViewer
                                  original={result.originalCode}
                                  modified={result.generatedCode}
                                  filename={result.filename}
                                  language={result.language}
                                />
                              </TabsContent>
                            )}
                            
                            <TabsContent value="explanation" className="mt-4">
                              <div className="glassmorphism border border-white/20 p-4 rounded-lg">
                                <h4 className="font-medium text-white mb-2">AI Explanation</h4>
                                <p className="text-white/80 text-sm leading-relaxed">
                                  {result.explanation}
                                </p>
                                
                                {result.suggestions.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="font-medium text-white/90 mb-2">
                                      Additional Suggestions
                                    </h5>
                                    <div className="space-y-2">
                                      {result.suggestions.map(suggestion => (
                                        <div 
                                          key={suggestion.id}
                                          className="p-2 rounded bg-white/5 border border-white/10"
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-white/80">
                                              Line {suggestion.line} - {suggestion.type}
                                            </span>
                                            <Badge 
                                              variant="outline" 
                                              className={`text-xs ${
                                                suggestion.severity === 'high' ? 'border-red-500/30 text-red-200' :
                                                suggestion.severity === 'medium' ? 'border-yellow-500/30 text-yellow-200' :
                                                'border-blue-500/30 text-blue-200'
                                              }`}
                                            >
                                              {suggestion.severity}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-white/70">
                                            {suggestion.message}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

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