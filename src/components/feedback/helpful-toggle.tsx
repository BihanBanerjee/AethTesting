'use client'

import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HelpfulToggleProps {
  helpful: boolean | null;
  onHelpfulChange: (helpful: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const HelpfulToggle: React.FC<HelpfulToggleProps> = ({
  helpful,
  onHelpfulChange,
  disabled = false,
  compact = false
}) => {
  return (
    <div className={cn(
      "flex items-center gap-2",
      compact ? "gap-1" : "gap-2"
    )}>
      <Button
        size={compact ? "sm" : "sm"}
        variant={helpful === true ? "default" : "outline"}
        onClick={() => onHelpfulChange(true)}
        disabled={disabled}
        className={cn(
          "transition-all duration-200 ease-in-out transform hover:scale-105",
          "flex items-center gap-1.5",
          compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs",
          helpful === true
            ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
            : "border-white/20 bg-white/10 text-white hover:bg-green-600/20 hover:border-green-600/40"
        )}
        aria-label="Mark as helpful"
      >
        <ThumbsUp className={cn(
          "transition-transform duration-200",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
          helpful === true && "scale-110"
        )} />
        {!compact && "Yes"}
      </Button>

      <Button
        size={compact ? "sm" : "sm"}
        variant={helpful === false ? "default" : "outline"}
        onClick={() => onHelpfulChange(false)}
        disabled={disabled}
        className={cn(
          "transition-all duration-200 ease-in-out transform hover:scale-105",
          "flex items-center gap-1.5",
          compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs",
          helpful === false
            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
            : "border-white/20 bg-white/10 text-white hover:bg-red-600/20 hover:border-red-600/40"
        )}
        aria-label="Mark as not helpful"
      >
        <ThumbsDown className={cn(
          "transition-transform duration-200",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
          helpful === false && "scale-110"
        )} />
        {!compact && "No"}
      </Button>
    </div>
  );
};