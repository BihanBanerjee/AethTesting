// src/components/code-assistant/intent-progress-tracker.tsx
'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Code, 
  Zap, 
  Search, 
  Bug, 
  Wrench, 
  Lightbulb, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface IntentProgressTrackerProps {
  intent: string | null | undefined;
  confidence: number;
  stage: 'analyzing' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
}

export const IntentProgressTracker: React.FC<IntentProgressTrackerProps> = ({
  intent,
  confidence,
  stage,
  progress,
  currentStep
}) => {
  const getIntentIcon = () => {
    if (!intent) return <Clock className="h-4 w-4 animate-pulse" />;
    
    switch (intent) {
      case 'code_generation': return <Code className="h-4 w-4" />;
      case 'code_improvement': return <Zap className="h-4 w-4" />;
      case 'code_review': return <Search className="h-4 w-4" />;
      case 'debug': return <Bug className="h-4 w-4" />;
      case 'refactor': return <Wrench className="h-4 w-4" />;
      case 'explain': return <Lightbulb className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'analyzing': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'processing': return <Clock className="h-4 w-4 animate-spin" />;
      case 'generating': return <Zap className="h-4 w-4 animate-pulse" />;
      case 'complete': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStageColor = () => {
    switch (stage) {
      case 'analyzing': return 'text-blue-300';
      case 'processing': return 'text-yellow-300';
      case 'generating': return 'text-purple-300';
      case 'complete': return 'text-green-300';
      case 'error': return 'text-red-300';
      default: return 'text-white/60';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glassmorphism border border-white/20 p-4 rounded-lg bg-white/5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIntentIcon()}
          <span className="font-medium text-white">
            {intent ? intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Processing...'}
          </span>
          <Badge variant="outline" className="text-xs">
            {Math.round((confidence || 0) * 100)}% confidence
          </Badge>
        </div>
        
        <div className={`flex items-center gap-1 ${getStageColor()}`}>
          {getStageIcon()}
          <span className="text-sm capitalize">{stage}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Progress</span>
          <span className="text-white">{progress}%</span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {currentStep && (
          <p className="text-xs text-white/60 mt-2">
            {currentStep}
          </p>
        )}
      </div>
    </motion.div>
  );
};