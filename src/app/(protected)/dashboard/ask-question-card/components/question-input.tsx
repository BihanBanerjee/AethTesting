// src/app/(protected)/dashboard/ask-question-card/components/question-input.tsx
'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
// import { SmartInputSuggestions } from '@/components/code-assistant/smart-input-suggestion';

interface QuestionInputProps {
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  disabled?: boolean;
  availableFiles?: string[];
  selectedFiles?: string[];
  onFileSelect?: (files: string[]) => void;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  onQuestionChange,
  onSubmit,
  loading,
  disabled = false,
  availableFiles = [],
  selectedFiles = [],
  onFileSelect
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            placeholder="Ask a question about your codebase..."
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            className="w-full min-h-[120px] bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-indigo-500 focus:ring-indigo-500/20 resize-none"
            disabled={disabled}
          />
          {/* Smart input suggestions temporarily disabled due to prop interface mismatch */}
        </div>
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