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