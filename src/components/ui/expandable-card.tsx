// src/components/ui/expandable-card.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';

interface ExpandableCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  expandable?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  actions?: React.ReactNode;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  children,
  className,
  title,
  subtitle,
  icon,
  defaultExpanded = true,
  expandable = true,
  onExpandChange,
  actions
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [isMaximized, setIsMaximized] = React.useState(false);

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <motion.div
      layout
      className={`
        ${className}
        ${isMaximized ? 'fixed inset-4 z-40' : 'relative'}
      `}
      animate={{
        height: isExpanded ? 'auto' : 'auto'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        layout: { duration: 0.3 }
      }}
    >
      <GlassmorphicCard 
        className={`
          h-full transition-all duration-300
          ${isMaximized ? 'shadow-2xl border-2 border-white/30' : ''}
        `}
      >
        {/* Header */}
        {(title || subtitle || expandable) && (
          <motion.div 
            layout
            className="p-6 pb-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              {icon && (
                <div className="p-2 bg-indigo-500/20 rounded-lg flex-shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-white/60 mt-1 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {actions}
              
              {expandable && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleMaximize}
                    className="text-white/60 hover:text-white hover:bg-white/10 p-2"
                    title={isMaximized ? 'Minimize' : 'Maximize'}
                  >
                    {isMaximized ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleExpand}
                    className="text-white/60 hover:text-white hover:bg-white/10 p-2"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Content */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                duration: 0.3,
                ease: 'easeInOut'
              }}
              className={`
                overflow-hidden
                ${title || subtitle ? 'px-6 pb-6' : 'p-6'}
              `}
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassmorphicCard>
    </motion.div>
  );
};