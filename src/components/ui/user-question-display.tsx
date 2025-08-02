'use client'

import React from 'react';
import type { QueryIntent } from '@/lib/intent-classifier';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  FileText, 
  Lightbulb, 
  Zap,
  Bug,
  Search,
  Wrench,
  CheckCircle,
  Loader2
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

interface UserQuestionDisplayProps {
  question: string;
  intentPreview?: QueryIntent | null;
  processingStage?: 'analyzing' | 'processing' | 'generating' | 'complete';
  loading?: boolean;
}

export const UserQuestionDisplay: React.FC<UserQuestionDisplayProps> = ({
  question,
  intentPreview,
  processingStage,
  loading
}) => {
  if (!question.trim() && !loading) return null;

  const getStatusIcon = () => {
    if (loading) {
      return <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />;
    }
    return <CheckCircle className="h-3 w-3 text-green-400" />;
  };

  const formatIntent = (type: string) => {
    return type?.replace('_', ' ') || 'question';
  };

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4 mt-4">
      <div className="flex justify-between items-start">
        {/* Question Text */}
        <div className="text-white/90 text-sm leading-relaxed flex-1 mr-3">
          {question || (loading ? "Processing your question..." : "")}
        </div>
        
        {/* Compact Badge - Simple flex positioning */}
        {intentPreview && (
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1 text-xs whitespace-nowrap">
            {React.createElement(intentIcons[intentPreview.type as keyof typeof intentIcons] || FileText, {
              className: "h-3 w-3 text-blue-300"
            })}
            <span className="text-white/80 font-medium">
              {formatIntent(intentPreview.type)}
            </span>
            <span className="text-white/60">
              ({Math.round((intentPreview.confidence || 0) * 100)}%)
            </span>
            {getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  );
};