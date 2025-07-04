// src/components/code/enhanced-code-block.tsx
'use client'

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Play, Eye, EyeOff, GitBranch, Check, X, Loader2, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
  diff?: {
    type: 'addition' | 'deletion' | 'modification';
    originalCode?: string;
  };
  actions?: {
    copy?: boolean;
    download?: boolean;
    run?: boolean;
    apply?: boolean;
    preview?: boolean;
  };
  onApply?: () => Promise<void>;
  onPreview?: () => void;
  suggestions?: CodeSuggestion[];
}

interface CodeSuggestion {
  id: string;
  line: number;
  type: 'performance' | 'security' | 'style' | 'bug';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className = '',
  diff,
  actions = { copy: true, download: true, run: false, apply: false, preview: false },
  onApply,
  onPreview,
  suggestions = []
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  };

  const handleApply = async () => {
    if (!onApply) return;
    
    setIsApplying(true);
    try {
      await onApply();
      toast.success('Code changes applied successfully');
    } catch (error) {
      toast.error('Failed to apply changes');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRun = () => {
    // Implement code execution logic here
    toast.info('Code execution would happen here');
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      python: 'py',
      rust: 'rs',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      css: 'css',
      html: 'html',
      json: 'json',
      yaml: 'yml',
      markdown: 'md'
    };
    return extensions[lang] || 'txt';
  };

  const getDiffTypeColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'deletion':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'modification':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    }
  };

  const getSuggestionColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  const customStyle = {
    ...oneDark,
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      borderRadius: '0.5rem',
      margin: 0,
    },
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      background: 'transparent',
    }
  };

  return (
    <motion.div 
      className={`rounded-lg overflow-hidden border border-white/20 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-white/10">
        <div className="flex items-center gap-2">
          {filename && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-white/60" />
              <span className="text-sm font-medium text-white/80">{filename}</span>
            </div>
          )}
          
          <Badge variant="outline" className="text-xs border-white/20 text-white/60">
            {language}
          </Badge>
          
          {diff && (
            <Badge variant="outline" className={`text-xs ${getDiffTypeColor(diff.type)}`}>
              <GitBranch className="h-3 w-3 mr-1" />
              {diff.type}
            </Badge>
          )}
          
          {highlightLines.length > 0 && (
            <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-300">
              {highlightLines.length} highlighted
            </Badge>
          )}
          
          {suggestions.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs border-blue-500/30 text-blue-300 cursor-pointer hover:bg-blue-500/10"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {suggestions.length} suggestions
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {suggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="h-6 w-6 p-0 text-white/60 hover:text-white"
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0 text-white/60 hover:text-white"
          >
            {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          
          {actions.copy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 text-white/60 hover:text-white"
            >
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </Button>
          )}
          
          {actions.download && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-6 w-6 p-0 text-white/60 hover:text-white"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
          
          {actions.preview && onPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
              className="h-6 w-6 p-0 text-white/60 hover:text-white"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          
          {actions.run && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRun}
              className="h-6 w-6 p-0 text-white/60 hover:text-white"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
          
          {actions.apply && onApply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleApply}
              disabled={isApplying}
              className="h-6 w-6 p-0 text-white/60 hover:text-white"
            >
              {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-white/10 bg-slate-900/50"
          >
            <div className="p-3 space-y-2">
              <h4 className="text-sm font-medium text-white/80 mb-2">Code Suggestions</h4>
              {suggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-2 rounded text-xs ${getSuggestionColor(suggestion.severity)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Line {suggestion.line} - {suggestion.type}</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.severity}
                    </Badge>
                  </div>
                  <p className="mb-1">{suggestion.message}</p>
                  <p className="font-mono text-xs opacity-80">{suggestion.suggestion}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <SyntaxHighlighter
              language={language}
              style={customStyle}
              showLineNumbers={showLineNumbers}
              lineNumberStyle={{ 
                color: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'transparent',
                paddingRight: '1rem',
                minWidth: '2.5rem'
              }}
              wrapLines={true}
              lineProps={(lineNumber) => {
                const isHighlighted = highlightLines.includes(lineNumber);
                const suggestion = suggestions.find(s => s.line === lineNumber);
                
                return {
                  style: {
                    backgroundColor: isHighlighted ? 'rgba(99, 102, 241, 0.1)' : 
                                   suggestion ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
                    borderLeft: isHighlighted ? '3px solid rgba(99, 102, 241, 0.5)' : 
                               suggestion ? '3px solid rgba(234, 179, 8, 0.5)' : 'none',
                    paddingLeft: (isHighlighted || suggestion) ? '0.5rem' : '0',
                    display: 'block'
                  }
                };
              }}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// src/components/code/diff-viewer.tsx
'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, Copy, Download, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface DiffViewerProps {
  original: string;
  modified: string;
  filename: string;
  language?: string;
  mode?: 'split' | 'unified';
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  filename,
  language = 'typescript',
  mode: initialMode = 'split'
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(initialMode);
  const [showWhitespace, setShowWhitespace] = useState(false);

  const generateDiff = () => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    // Simple diff algorithm (you might want to use a proper diff library)
    const diff = [];
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';
      
      if (originalLine === modifiedLine) {
        diff.push({
          type: 'unchanged',
          originalLineNumber: i + 1,
          modifiedLineNumber: i + 1,
          content: originalLine
        });
      } else if (originalLine && !modifiedLine) {
        diff.push({
          type: 'removed',
          originalLineNumber: i + 1,
          modifiedLineNumber: null,
          content: originalLine
        });
      } else if (!originalLine && modifiedLine) {
        diff.push({
          type: 'added',
          originalLineNumber: null,
          modifiedLineNumber: i + 1,
          content: modifiedLine
        });
      } else {
        diff.push({
          type: 'changed',
          originalLineNumber: i + 1,
          modifiedLineNumber: i + 1,
          originalContent: originalLine,
          modifiedContent: modifiedLine
        });
      }
    }
    
    return diff;
  };

  const diff = generateDiff();
  const stats = {
    additions: diff.filter(line => line.type === 'added' || line.type === 'changed').length,
    deletions: diff.filter(line => line.type === 'removed' || line.type === 'changed').length,
    unchanged: diff.filter(line => line.type === 'unchanged').length
  };

  const handleCopyDiff = () => {
    const diffText = diff.map(line => {
      if (line.type === 'added') return `+ ${line.content}`;
      if (line.type === 'removed') return `- ${line.content}`;
      if (line.type === 'changed') return `- ${line.originalContent}\n+ ${line.modifiedContent}`;
      return `  ${line.content}`;
    }).join('\n');
    
    navigator.clipboard.writeText(diffText);
    toast.success('Diff copied to clipboard');
  };

  const DiffLine = ({ line }: { line: any }) => {
    const getLineStyle = (type: string) => {
      switch (type) {
        case 'added':
          return 'bg-green-500/10 border-l-2 border-green-500/50 text-green-100';
        case 'removed':
          return 'bg-red-500/10 border-l-2 border-red-500/50 text-red-100';
        case 'changed':
          return 'bg-yellow-500/10 border-l-2 border-yellow-500/50 text-yellow-100';
        default:
          return 'text-white/80';
      }
    };

    const getLinePrefix = (type: string) => {
      switch (type) {
        case 'added':
          return '+';
        case 'removed':
          return '-';
        default:
          return ' ';
      }
    };

    if (line.type === 'changed') {
      return (
        <>
          <div className={`flex font-mono text-sm px-4 py-1 ${getLineStyle('removed')}`}>
            <span className="w-12 text-white/40 mr-4">
              {line.originalLineNumber}
            </span>
            <span className="w-4 mr-2">-</span>
            <span>{line.originalContent}</span>
          </div>
          <div className={`flex font-mono text-sm px-4 py-1 ${getLineStyle('added')}`}>
            <span className="w-12 text-white/40 mr-4">
              {line.modifiedLineNumber}
            </span>
            <span className="w-4 mr-2">+</span>
            <span>{line.modifiedContent}</span>
          </div>
        </>
      );
    }

    return (
      <div className={`flex font-mono text-sm px-4 py-1 ${getLineStyle(line.type)}`}>
        <span className="w-12 text-white/40 mr-4">
          {line.originalLineNumber || line.modifiedLineNumber}
        </span>
        <span className="w-4 mr-2">{getLinePrefix(line.type)}</span>
        <span>{line.content}</span>
      </div>
    );
  };

  return (
    <motion.div 
      className="rounded-lg overflow-hidden border border-white/20 bg-slate-900/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-indigo-200" />
          <span className="font-medium text-white">{filename}</span>
          <Badge variant="outline" className="text-xs border-white/20 text-white/60">
            {language}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs text-white/60 mr-4">
            <span className="text-green-400">+{stats.additions}</span>
            {' '}
            <span className="text-red-400">-{stats.deletions}</span>
          </div>
          
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'split' | 'unified')}>
            <TabsList className="h-8">
              <TabsTrigger value="split" className="text-xs">Split</TabsTrigger>
              <TabsTrigger value="unified" className="text-xs">Unified</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyDiff}
            className="h-8 px-2 text-white/60 hover:text-white"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="max-h-96 overflow-auto">
        {viewMode === 'unified' ? (
          <div>
            {diff.map((line, index) => (
              <DiffLine key={index} line={line} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2">
            <div className="border-r border-white/10">
              <div className="px-3 py-1 bg-red-500/10 text-red-200 text-xs font-medium border-b border-white/10">
                Original
              </div>
              {original.split('\n').map((line, index) => (
                <div key={index} className="flex font-mono text-sm px-4 py-1 text-white/80">
                  <span className="w-8 text-white/40 mr-4">{index + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="px-3 py-1 bg-green-500/10 text-green-200 text-xs font-medium border-b border-white/10">
                Modified
              </div>
              {modified.split('\n').map((line, index) => (
                <div key={index} className="flex font-mono text-sm px-4 py-1 text-white/80">
                  <span className="w-8 text-white/40 mr-4">{index + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};