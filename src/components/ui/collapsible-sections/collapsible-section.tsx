'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionHeader } from './section-header';
import { SectionContent } from './section-content';
import type { CollapsibleSectionProps } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  badge,
  actions,
  priority = 'medium',
  children,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'border border-white/10 rounded-lg overflow-hidden mb-4 glassmorphism bg-black/20',
        className
      )}
    >
      <SectionHeader
        title={title}
        icon={icon}
        isOpen={isOpen}
        onToggle={onToggle}
        badge={badge}
        actions={actions}
        priority={priority}
      />
      
      <SectionContent isOpen={isOpen}>
        {children}
      </SectionContent>
    </motion.div>
  );
};