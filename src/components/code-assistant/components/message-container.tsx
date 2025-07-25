'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import type { MessageContainerProps } from '../types/message-display.types';

export const MessageContainer: React.FC<MessageContainerProps> = ({
  type,
  children
}) => {
  const { user } = useUser();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`max-w-4xl ${type === 'user' ? 'ml-16' : 'mr-16'}`}>
        <GlassmorphicCard className={`p-6 ${
          type === 'user' 
            ? 'bg-indigo-600/25 border-indigo-500/40 chatgpt-user-message' 
            : 'bg-white/8 border-white/15 chatgpt-assistant-message'
        }`}>
          {/* ChatGPT-style avatar indicator */}
          <div className="flex items-start gap-3">
            {type === 'user' ? (
              // User avatar with profile picture
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-500/50">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.firstName || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ) : (
              // AI avatar
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                AI
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </GlassmorphicCard>
      </div>
    </motion.div>
  );
};