'use client'

import React from 'react';
import { Code, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedQuestionCard from '../enhanced-question-card/enhanced-question-card';
import StatisticsOverview from '../statistics-overview/statistics-overview';
import EnhancedAskQuestionCard from '../../../dashboard/ask-question-card';
import type { Statistics } from '../../types/statistics';
import type { Question } from '../../types/question';

interface QuestionsTabProps {
  questions: Question[];
  statistics: Statistics | null | undefined;
  filters: {
    intent: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain' | undefined;
    timeRange: 'day' | 'week' | 'month' | 'all';
    sortBy: 'createdAt' | 'satisfaction' | 'confidence';
    sortOrder: 'asc' | 'desc';
  };
  onFilterChange: (filters: {
    intent?: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain' | undefined;
    timeRange?: 'day' | 'week' | 'month' | 'all';
    sortBy?: 'createdAt' | 'satisfaction' | 'confidence';
    sortOrder?: 'asc' | 'desc';
  }) => void;
  onQuestionClick: (index: number) => void;
  onDeleteQuestion: (questionId: string) => void;
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({
  questions,
  statistics,
  filters,
  onFilterChange,
  onQuestionClick,
  onDeleteQuestion
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/60" />
            <Select 
              value={filters.intent || 'all'} 
              onValueChange={(value) => onFilterChange({ 
                intent: value === 'all' ? undefined : value as 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain'
              })}
            >
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All intents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intents</SelectItem>
                <SelectItem value="code_generation">Code Generation</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="code_review">Code Review</SelectItem>
                <SelectItem value="explain">Explain</SelectItem>
                <SelectItem value="code_improvement">Improvement</SelectItem>
                <SelectItem value="refactor">Refactor</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select 
            value={filters.timeRange} 
            onValueChange={(value) => onFilterChange({ timeRange: value as 'day' | 'week' | 'month' | 'all' })}
          >
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={`${filters.sortBy}-${filters.sortOrder}`} 
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              onFilterChange({ 
                sortBy: sortBy as 'createdAt' | 'satisfaction' | 'confidence',
                sortOrder: sortOrder as 'asc' | 'desc'
              });
            }}
          >
            <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="satisfaction-desc">Highest Rated</SelectItem>
              <SelectItem value="confidence-desc">Most Confident</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <EnhancedAskQuestionCard />
      
      <div className='h-6'></div>
      
      <StatisticsOverview statistics={statistics} />
      
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100'>
          Saved Questions & Answers
        </h1>
        {questions && questions.length > 0 && (
          <div className="text-white/60 text-sm">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'} 
            {filters.intent && ` · ${filters.intent.replace('_', ' ')}`}
            {filters.timeRange !== 'all' && ` · ${filters.timeRange}`}
          </div>
        )}
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {questions?.length === 0 && (
          <div className="glassmorphism border border-white/20 p-8 text-center text-white/70 rounded-xl col-span-2">
            <Code className="h-12 w-12 mx-auto mb-3 text-white/40" />
            <p className="text-lg">
              {filters.intent || filters.timeRange !== 'all' 
                ? 'No questions found for the selected filters. Try adjusting your search criteria.'
                : 'No saved questions yet. Ask something about your codebase!'
              }
            </p>
            {(filters.intent || filters.timeRange !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4 border-white/20 bg-white/10 text-white"
                onClick={() => onFilterChange({ 
                  intent: undefined, 
                  timeRange: 'all', 
                  sortBy: 'createdAt', 
                  sortOrder: 'desc' 
                })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
        
        {questions?.map((question, index) => (
          <EnhancedQuestionCard 
            key={question.id}
            question={question}
            index={index}
            onClick={() => onQuestionClick(index)}
            onDelete={onDeleteQuestion}
          />
        ))}
      </div>
    </>
  );
};

export default QuestionsTab;