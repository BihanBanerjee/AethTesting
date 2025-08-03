// src/app/(protected)/qa/page.tsx - Modularized version with clean architecture

'use client'

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QAProvider, useQAContext } from '@/contexts/qa-context';
import { DashboardProvider } from '@/contexts/dashboard-context';
import useProject from '@/hooks/use-project';

// Import modularized components
import QuestionsTab from './components/questions-tab/questions-tab';
import AnalyticsDashboard from './components/analytics-dashboard/analytics-dashboard';
import DeleteConfirmationDialog from './components/delete-confirmation-dialog/delete-confirmation-dialog';
import { EnhancedQuestionModal } from './components/enhanced-question-modal';
import ScrollbarStyles from './components/scrollbar-styles';
import { AdvancedAnalyticsOverview } from './components/advanced-analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Question } from './types/question';

const EnhancedQAPageContent: React.FC = () => {
  const { projectId } = useProject();
  const {
    questions,
    statistics,
    isLoading,
    selectedQuestion,
    filters,
    handleFilterChange,
    activeTab,
    analyticsMode,
    deleteDialogOpen,
    setActiveTab,
    setAnalyticsMode,
    setDeleteDialogOpen,
    openQuestion,
    closeQuestion,
    handleDeleteQuestion,
    confirmDelete,
    cancelDelete,
  } = useQAContext();

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
          
          {activeTab === 'analytics' && (
            <Select value={analyticsMode} onValueChange={(value) => setAnalyticsMode(value as 'basic' | 'advanced')}>
              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          )}
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
          {analyticsMode === 'basic' ? (
            <AnalyticsDashboard
              statistics={statistics}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          ) : (
            <AdvancedAnalyticsOverview
              projectId={projectId}
              timeRange={filters.timeRange}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Enhanced Question Modal */}
      {selectedQuestion && (
        <EnhancedQuestionModal 
          isOpen={true}
          question={selectedQuestion}
          onClose={closeQuestion} 
        />
      )}

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

const EnhancedQAPage: React.FC = () => {
  return (
    <DashboardProvider>
      <QAProvider>
        <EnhancedQAPageContent />
      </QAProvider>
    </DashboardProvider>
  );
};

export default EnhancedQAPage;