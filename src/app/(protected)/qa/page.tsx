// src/app/(protected)/qa/page.tsx - Modularized version with clean architecture

'use client'

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';

// Import modularized components
import QuestionsTab from './components/questions-tab/questions-tab';
import AnalyticsDashboard from './components/analytics-dashboard/analytics-dashboard';
import DeleteConfirmationDialog from './components/delete-confirmation-dialog/delete-confirmation-dialog';
import QuestionDetail from './components/question-detail/question-detail';
import ScrollbarStyles from './components/scrollbar-styles';

const EnhancedQAPage: React.FC = () => {
  const { projectId } = useProject();
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    intent: undefined as 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain' | undefined,
    timeRange: 'all' as 'day' | 'week' | 'month' | 'all',
    sortBy: 'createdAt' as 'createdAt' | 'satisfaction' | 'confidence',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [activeTab, setActiveTab] = useState('questions');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Enhanced query with filters
  const { data: questionsData, isLoading, refetch } = api.project.getQuestions.useQuery({
    projectId,
    intent: filters.intent,
    timeRange: filters.timeRange,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  });

  // Get statistics
  const { data: statistics } = api.project.getQuestionStatistics.useQuery({
    projectId,
    timeRange: filters.timeRange
  });

  // Delete question mutation
  const deleteQuestionMutation = api.project.deleteQuestion.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Failed to delete question:', error);
    }
  });

  const questions = questionsData?.questions || [];
  const selectedQuestion = selectedQuestionIndex !== null ? questions[selectedQuestionIndex] : null;

  const openQuestion = (index: number) => {
    setSelectedQuestionIndex(index);
  };

  const closeQuestion = () => {
    setSelectedQuestionIndex(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate({ questionId: questionToDelete });
    }
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleFilterChange = (newFilters: {
    intent?: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain' | undefined;
    timeRange?: 'day' | 'week' | 'month' | 'all';
    sortBy?: 'createdAt' | 'satisfaction' | 'confidence';
    sortOrder?: 'asc' | 'desc';
  }) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center">
        <div className="glassmorphism border border-white/20 p-8 rounded-xl flex flex-col items-center">
          <div className="relative h-16 w-16 mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-1 rounded-full border-b-2 border-l-2 border-purple-400 animate-spin animate-delay-150"></div>
            <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-blue-400 animate-spin animate-delay-300 animate-reverse"></div>
          </div>
          <p className="text-white/80 text-lg mt-2 animate-pulse">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-auto grid-cols-2 bg-white/10">
            <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="questions">
          <QuestionsTab
            questions={questions}
            statistics={statistics}
            filters={filters}
            onFilterChange={handleFilterChange}
            onQuestionClick={openQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard
            statistics={statistics}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
      </Tabs>
      
      {/* Question detail modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <QuestionDetail 
            question={selectedQuestion} 
            onClose={closeQuestion} 
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Custom scrollbar styles */}
      <ScrollbarStyles />
    </>
  );
};

export default EnhancedQAPage;