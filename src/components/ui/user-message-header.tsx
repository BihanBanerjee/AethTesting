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
  User
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

interface UserMessageHeaderProps {
  intentPreview?: QueryIntent | null;
  processingStage?: 'analyzing' | 'processing' | 'generating' | 'complete';
  loading?: boolean;
}

export const UserMessageHeader: React.FC<UserMessageHeaderProps> = ({
  intentPreview,
  processingStage,
  loading
}) => {
  const getStatusIcon = () => {
    if (loading || processingStage !== 'complete') {
      return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />;
    }
    return <CheckCircle className="h-3 w-3 text-green-400" />;
  };

  const formatIntent = (type: string) => {
    return type?.replace('_', ' ') || 'Question';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-300';
    if (confidence >= 0.6) return 'text-yellow-300';
    return 'text-red-300';
  };

  return (
    <div className="flex items-center justify-between text-xs text-white/60 mb-2">
      <div className="flex items-center gap-2">
        <User className="h-3 w-3" />
        <span>User Question</span>
        
        {intentPreview && (
          <>
            <span>•</span>
            {React.createElement(intentIcons[intentPreview.type as keyof typeof intentIcons] || FileText, {
              className: "h-3 w-3"
            })}
            <Badge className={`text-xs px-1 py-0 h-5 ${intentColors[intentPreview.type as keyof typeof intentColors] || intentColors.question}`}>
              {formatIntent(intentPreview.type)}
            </Badge>
            <span className={`${getConfidenceColor(intentPreview.confidence || 0)}`}>
              ({Math.round((intentPreview.confidence || 0) * 100)}% confidence)
            </span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="capitalize">{processingStage || 'Complete'}</span>
      </div>
    </div>
  );
};