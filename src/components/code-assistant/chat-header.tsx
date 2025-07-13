'use client'

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface ChatHeaderProps {
  projectName?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ projectName }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
          AI Code Assistant
        </h1>
        <p className="text-white/70">
          Intelligent coding companion with intent classification for {projectName}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-green-500/30 text-green-300">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
          AI Ready
        </Badge>
        <Button variant="outline" size="sm" className="border-white/20 bg-white/10">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};