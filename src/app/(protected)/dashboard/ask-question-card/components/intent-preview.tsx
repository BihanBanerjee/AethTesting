// src/app/(protected)/dashboard/ask-question-card/components/intent-preview.tsx
'use client';

import React from 'react';
import type { QueryIntent } from '@/lib/intent-classifier';
import { Badge } from '@/components/ui/badge';
import { IntentProgressTracker } from '@/components/code-assistant/intent-progress-tracker';
import { 
  Code, 
  FileText, 
  Lightbulb, 
  Zap,
  Bug,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';

const intentIcons = {
  question: FileText,
  code_generation: Code,
  code_improvement: Zap,
  code_review: Search,
  refactor: Wrench,
  debug: Bug,
  explain: Lightbulb,
};

const intentColors = {
  question: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  code_generation: 'bg-green-500/20 text-green-300 border-green-500/30',
  code_improvement: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  code_review: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  refactor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  debug: 'bg-red-500/20 text-red-300 border-red-500/30',
  explain: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

interface IntentPreviewProps {
  intentPreview: QueryIntent | null;
  processingStage: 'analyzing' | 'processing' | 'generating' | 'complete';
  loading: boolean;
}

export const IntentPreview: React.FC<IntentPreviewProps> = ({
  intentPreview,
  processingStage,
  loading
}) => {
  if (!intentPreview && !loading) return null;

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white/80">Intent Analysis</h4>
        <IntentProgressTracker 
          intent={intentPreview?.type || 'question'}
          confidence={intentPreview?.confidence || 0}
          stage={processingStage}
          progress={processingStage === 'analyzing' ? 25 : processingStage === 'processing' ? 50 : processingStage === 'generating' ? 75 : 100}
          currentStep={processingStage}
        />
      </div>
      
      {intentPreview && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {React.createElement(intentIcons[intentPreview.type as keyof typeof intentIcons] || FileText, {
              className: "h-4 w-4"
            })}
            <Badge className={intentColors[intentPreview.type as keyof typeof intentColors] || intentColors.question}>
              {intentPreview.type?.replace('_', ' ') || 'Question'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Confidence:</span>
            <span className="text-white/80">{Math.round((intentPreview.confidence || 0) * 100)}%</span>
          </div>
          
          {intentPreview.targetFiles && intentPreview.targetFiles.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>Target Files:</span>
              <span className="text-white/80">{intentPreview.targetFiles.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};