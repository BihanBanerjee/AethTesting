'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import type { MessageContainerProps } from '../types/message-display.types';

export const MessageContainer: React.FC<MessageContainerProps> = ({
  type,
  children
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-4xl ${type === 'user' ? 'ml-12' : 'mr-12'}`}>
        <GlassmorphicCard className={`p-4 ${
          type === 'user' 
            ? 'bg-indigo-600/20 border-indigo-500/30' 
            : 'bg-white/10 border-white/20'
        }`}>
          {children}
        </GlassmorphicCard>
      </div>
    </motion.div>
  );
};