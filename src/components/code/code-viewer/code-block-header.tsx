'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Play, Eye, EyeOff, GitBranch, Check, Loader2, FileText, Settings } from 'lucide-react';
import { getDiffTypeColor } from './utils';
import type { CodeBlockProps } from './types';

interface CodeBlockHeaderProps {
  filename?: string;
  language: string;
  diff?: CodeBlockProps['diff'];
  highlightLines: number[];
  suggestions: CodeBlockProps['suggestions'];
  isExpanded: boolean;
  showSuggestions: boolean;
  actions: CodeBlockProps['actions'];
  copied: boolean;
  isApplying: boolean;
  onToggleExpanded: () => void;
  onToggleSuggestions: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onPreview?: () => void;
  onRun: () => void;
  onApply: () => void;
}

export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = ({
  filename,
  language,
  diff,
  highlightLines,
  suggestions = [],
  isExpanded,
  showSuggestions,
  actions = {},
  copied,
  isApplying,
  onToggleExpanded,
  onToggleSuggestions,
  onCopy,
  onDownload,
  onPreview,
  onRun,
  onApply
}) => {
  return (
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
        
        {suggestions.length > 0 && showSuggestions && (
          <Badge 
            variant="outline" 
            className="text-xs border-blue-500/30 text-blue-300 cursor-pointer hover:bg-blue-500/10"
            onClick={onToggleSuggestions}
          >
            {suggestions.length} suggestions
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {suggestions.length > 0 && showSuggestions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSuggestions}
            className="h-6 w-6 p-0 text-white/60 hover:text-white"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
          className="h-6 w-6 p-0 text-white/60 hover:text-white"
        >
          {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
        
        {actions.copy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-6 w-6 p-0 text-white/60 hover:text-white"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        )}
        
        {actions.download && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
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
            onClick={onRun}
            className="h-6 w-6 p-0 text-white/60 hover:text-white"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
        
        {actions.apply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onApply}
            disabled={isApplying}
            className="h-6 w-6 p-0 text-white/60 hover:text-white"
          >
            {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
};