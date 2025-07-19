import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, Copy } from 'lucide-react';
import { DiffStats } from './diff-stats';
import type { DiffHeaderProps } from './types';

export const DiffHeader: React.FC<DiffHeaderProps> = ({
  filename,
  language,
  stats,
  viewMode,
  onViewModeChange,
  onCopyDiff
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-white/10">
      <div className="flex items-center gap-3">
        <GitBranch className="h-5 w-5 text-indigo-200" />
        <span className="font-medium text-white">{filename}</span>
        <Badge variant="outline" className="text-xs border-white/20 text-white/60">
          {language}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <DiffStats stats={stats} />
        
        <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as 'split' | 'unified')}>
          <TabsList className="h-8">
            <TabsTrigger value="split" className="text-xs">Split</TabsTrigger>
            <TabsTrigger value="unified" className="text-xs">Unified</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyDiff}
          className="h-8 px-2 text-white/60 hover:text-white"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};