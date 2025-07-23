'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SectionPriority } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface SectionHeaderProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  actions?: React.ReactNode;
  priority?: SectionPriority;
  className?: string;
}

const getPriorityStyles = (priority: SectionPriority) => {
  switch (priority) {
    case 'high':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'medium':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'low':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default:
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  badge,
  actions,
  priority = 'medium',
  className
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors',
        'sm:p-3 p-2', // Responsive padding
        className
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-indigo-400 flex-shrink-0" />
          <h4 className="text-sm font-medium text-white truncate">{title}</h4>
        </div>
        
        {badge && (
          <Badge className={cn('text-xs', getPriorityStyles(priority))}>
            {badge}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {actions && (
          <div 
            className="flex items-center gap-1 sm:flex hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 h-auto"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>
    </div>
  );
};