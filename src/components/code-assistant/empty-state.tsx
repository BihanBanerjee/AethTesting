'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Code, Sparkles } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Code className="h-12 w-12 text-white/40" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-2 w-2 text-white" />
          </div>
        </div>
      </div>
      <h3 className="text-lg font-medium text-white/80 mb-2">
        AI-Powered Code Assistant Ready
      </h3>
      <p className="text-white/60 mb-6">
        Ask me to generate, review, debug, explain, or improve your code. I understand your intent automatically!
      </p>
    </motion.div>
  );
};
