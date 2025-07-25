// src/app/(protected)/dashboard/ask-question-card/components/question-input.tsx
'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Code, FileText, Lightbulb, Zap, Bug, Search, Wrench, CheckCircle } from 'lucide-react';
import { SmartInputSuggestions } from '@/components/code-assistant/smart-input-suggestion';

const intentIcons = {
  question: FileText,
  code_generation: Code,
  code_improvement: Zap,
  code_review: Search,
  refactor: Wrench,
  debug: Bug,
  explain: Lightbulb,
};

interface QuestionInputProps {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  disabled?: boolean;
  availableFiles?: string[];
  selectedFiles?: string[];
  onFileSelect?: (files: string[]) => void;
  intentPreview?: any;
  processingStage?: 'analyzing' | 'processing' | 'generating' | 'complete';
  projectId?: string;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  onQuestionChange,
  onSubmit,
  loading,
  disabled = false,
  availableFiles = [],
  selectedFiles = [],
  onFileSelect,
  intentPreview,
  processingStage,
  projectId
}) => {
  const formatIntent = (type: string) => {
    return type?.replace('_', ' ') || 'question';
  };

  const getStatusIcon = () => {
    if (loading && processingStage === 'analyzing') {
      return <Loader2 className="h-3 w-3 animate-spin text-blue-400" />;
    }
    if (loading) {
      return <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />;
    }
    if (intentPreview) {
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    }
    return null;
  };
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            placeholder="Ask a question about your codebase..."
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            className="w-full min-h-[120px] bg-white/10 border-white/20 text-white focus:border-indigo-500 focus:ring-indigo-500/20 resize-none pr-40"
            style={{
              color: '#ffffff'
            }}
            disabled={disabled}
          />
          <style jsx>{`
            textarea::placeholder {
              color: rgba(255, 255, 255, 0.8) !important;
              opacity: 1 !important;
              font-weight: 500;
            }
          `}</style>
          
          {/* Intent Badge - Shows during/after analysis */}
          {(intentPreview || (loading && processingStage === 'analyzing')) && question.trim() && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs border border-white/20">
              {loading && processingStage === 'analyzing' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                  <span className="text-white/80 font-medium">Analyzing...</span>
                </>
              ) : intentPreview ? (
                <>
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
                </>
              ) : null}
            </div>
          )}
        </div>
        
        <SmartInputSuggestions
          currentInput={question}
          onSuggestionSelect={onQuestionChange}
          projectContext={{
            projectId: projectId,
            availableFiles: availableFiles,
            techStack: ['React', 'TypeScript', 'Next.js'],
            recentQueries: []
          }}
        />
      </div>
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!question.trim() || loading || disabled}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask Question
            </>
          )}
        </Button>
      </div>
    </form>
  );
};