'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionContentProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const SectionContent: React.FC<SectionContentProps> = ({
  isOpen,
  children,
  className
}) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ 
            height: 0, 
            opacity: 0 
          }}
          animate={{ 
            height: 'auto', 
            opacity: 1 
          }}
          exit={{ 
            height: 0, 
            opacity: 0 
          }}
          transition={{ 
            duration: 0.3, 
            ease: 'easeInOut',
            opacity: { duration: 0.2 }
          }}
          className="overflow-hidden"
        >
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            exit={{ y: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className={cn('p-4', className)}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};