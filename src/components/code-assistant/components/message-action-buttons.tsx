'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import type { ActionButtonsProps } from '../types/message-display.types';

export const MessageActionButtons: React.FC<ActionButtonsProps> = ({
  onCopy,
  onDownload
}) => {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onCopy}
        className="border-white/20 bg-white/10 text-white"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onDownload}
        className="border-white/20 bg-white/10 text-white"
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
};