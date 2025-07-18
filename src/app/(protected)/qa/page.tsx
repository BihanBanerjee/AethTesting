// src/app/(protected)/qa/page.tsx - Enhanced version with rich analytics

'use client'

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Code, Filter, TrendingUp, BarChart3, Clock, Star, Zap, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';

// Import components
import QuestionDetail from './components/question-detail/question-detail';
import ScrollbarStyles from './components/scrollbar-styles';
import EnhancedAskQuestionCard from '../dashboard/ask-question-card';

// Enhanced Question Card component
const EnhancedQuestionCard = ({ question, index, onClick, onDelete }: {
  question: any;
  index: number;
  onClick: () => void;
  onDelete: (id: string) => void;
}) => {
  let parsedMetadata = null;
  try {
    parsedMetadata = question.metadata ? 
      (typeof question.metadata === 'string' ? 
        JSON.parse(question.metadata) : 
        question.metadata) : null;
  } catch (error) {
    console.warn(`Failed to parse metadata for question ${question.id}:`, error);
  }
  // Check if we have generated code
  const hasGeneratedCode = !!(parsedMetadata?.generatedCode || 
                             parsedMetadata?.improvements?.improvedCode ||
                             parsedMetadata?.refactor?.refactoredCode);
  return (
    <motion.div 
      key={question.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className='glassmorphism border border-white/20 hover:border-indigo-400/30 hover:bg-white/5 transition-all hover:translate-y-[-2px] hover:shadow-lg'>
        <CardContent className='p-4'>
          <div className='flex justify-between items-start mb-3'>
            <div className='flex items-center flex-1'>
              <div className='flex-shrink-0 mr-3'>
                <img 
                  src={question.user.imageUrl || ''}
                  alt={question.user.firstName || 'User'}
                  className='rounded-full h-10 w-10 ring-2 ring-indigo-400/30 object-cover'
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{question.displayProperties.intentIcon}</span>
                  <h3 className='text-lg font-medium line-clamp-1 text-white'>
                    {question.question}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${question.displayProperties.intentColor}`}>
                    {question.intent?.replace('_', ' ') || 'question'}
                  </Badge>
                  {question.displayProperties.confidenceLevel && (
                    <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                      {question.displayProperties.confidenceLevel} confidence
                    </Badge>
                  )}
                  {question.displayProperties.satisfactionLevel && (
                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-300">
                      <Star className="h-3 w-3 mr-1" />
                      {question.displayProperties.satisfactionLevel}
                    </Badge>
                  )}
                  {/* Show generated code badge */}
                  {hasGeneratedCode && (
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">
                      <Code className="h-3 w-3 mr-1" />
                      Code Generated
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(question.id);
                  }}
                  className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 p-1 h-8 w-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <span className='text-xs text-white/50 whitespace-nowrap flex items-center'>
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(question.createdAt).toLocaleDateString()}
                </span>
              </div>
              {question.analytics.estimatedImpact && (
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                  Impact: {question.analytics.estimatedImpact}
                </Badge>
              )}
            </div>
          </div>
          
          <div className='bg-white/5 rounded-md p-3 h-24 overflow-hidden relative'>
            <p className='text-white/70 text-sm line-clamp-4'>
              {question.answer}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
          </div>
          
          <div className='flex justify-between items-center mt-3 text-sm'>
            <div className="flex items-center gap-4 text-white/50">
              <span>
                {/* Show file references OR generated code count */}
                {question.filesReferences?.length > 0 ? 
                  `${question.filesReferences.length} file references` :
                  hasGeneratedCode ? 
                    '1 generated file' :
                    '0 file references'
                }
              </span>
              {question.displayProperties.processingTimeFormatted && (
                <span className="flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  {question.displayProperties.processingTimeFormatted}
                </span>
              )}
              {question.analytics.hasEnhancedData && (
                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">
                  Enhanced Data
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 bg-white/10 text-white hover:bg-indigo-600/50"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

};

// Statistics Overview Component
const StatisticsOverview = ({ statistics }: { statistics: any }) => {
  if (!statistics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="glassmorphism border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Total Questions
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-white/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{statistics.total}</div>
          <p className="text-xs text-white/60">
            Past {statistics.timeRange}
          </p>
        </CardContent>
      </Card>

      <Card className="glassmorphism border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Avg Satisfaction
          </CardTitle>
          <Star className="h-4 w-4 text-white/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {statistics.satisfaction.average?.toFixed(1) || 'N/A'}/5
          </div>
          <p className="text-xs text-white/60">
            {statistics.satisfaction.totalRatings} ratings
          </p>
        </CardContent>
      </Card>

      <Card className="glassmorphism border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Code Generated
          </CardTitle>
          <Code className="h-4 w-4 text-white/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {statistics.codeGeneration.totalGenerated}
          </div>
          <p className="text-xs text-white/60">
            {Math.round(statistics.codeGeneration.applicationRate * 100)}% applied
          </p>
        </CardContent>
      </Card>

      <Card className="glassmorphism border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Avg Response Time
          </CardTitle>
          <Clock className="h-4 w-4 text-white/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {statistics.performance.avgProcessingTime ? 
              `${(statistics.performance.avgProcessingTime / 1000).toFixed(1)}s` : 
              'N/A'}
          </div>
          <p className="text-xs text-white/60">
            Processing time
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const EnhancedQAPage: React.FC = () => {
  const { projectId } = useProject();
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    intent: undefined as string | undefined,
    timeRange: 'all' as string,
    sortBy: 'createdAt' as string,
    sortOrder: 'desc' as string
  });
  const [activeTab, setActiveTab] = useState('questions');

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
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      deleteQuestionMutation.mutate({ questionId });
    }
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

          {activeTab === 'questions' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white/60" />
                <Select 
                  value={filters.intent || 'all'} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, intent: value === 'all' ? undefined : value }))}
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}
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
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
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
          )}
        </div>

        <TabsContent value="questions">
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
                    onClick={() => setFilters({ intent: undefined, timeRange: 'all', sortBy: 'createdAt', sortOrder: 'desc' })}
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
                onClick={() => openQuestion(index)}
                onDelete={handleDeleteQuestion}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {/* Import and use the analytics dashboard component */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  AI Interaction Analytics
                </h2>
                <p className="text-white/70 mt-1">
                  Detailed insights into your AI-powered development workflow
                </p>
              </div>
              
              <Select 
                value={filters.timeRange} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}
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
            </div>

            {/* Enhanced Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glassmorphism border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Total Interactions
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-white/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{statistics?.total || 0}</div>
                  <p className="text-xs text-white/60">
                    AI-powered interactions
                  </p>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Code Generation Success
                  </CardTitle>
                  <Code className="h-4 w-4 text-white/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {Math.round((statistics?.codeGeneration.applicationRate || 0) * 100)}%
                  </div>
                  <p className="text-xs text-white/60">
                    {statistics?.codeGeneration.totalApplied || 0} of {statistics?.codeGeneration.totalGenerated || 0} applied
                  </p>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Lines Generated
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-white/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {statistics?.codeGeneration.totalLinesGenerated?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-white/60">
                    Total lines of code
                  </p>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Avg Confidence
                  </CardTitle>
                  <Zap className="h-4 w-4 text-white/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {Math.round((statistics?.confidence.average || 0) * 100)}%
                  </div>
                  <p className="text-xs text-white/60">
                    Intent classification
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Intent Distribution */}
            {statistics?.intentDistribution && (
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Intent Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(statistics.intentDistribution).map(([intent, count]) => (
                      <div key={intent} className="text-center">
                        <div className="text-2xl font-bold text-white">{count as number}</div>
                        <div className="text-sm text-white/60 capitalize">
                          {intent.replace('_', ' ')}
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full" 
                            style={{ 
                              width: `${((count as number) / statistics.total) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Productivity Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Productivity Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-sm text-green-200">Code Applied Successfully</span>
                      <span className="text-lg font-bold text-green-200">
                        {Math.round((statistics?.codeGeneration.applicationRate || 0) * 100)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <span className="text-sm text-blue-200">Average Satisfaction</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-200">
                          {statistics?.satisfaction.average?.toFixed(1) || 'N/A'}/5
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (statistics?.satisfaction.average || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-white/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <span className="text-sm text-purple-200">Avg Response Time</span>
                      <span className="text-lg font-bold text-purple-200">
                        {statistics?.performance.avgProcessingTime ? 
                          `${(statistics.performance.avgProcessingTime / 1000).toFixed(1)}s` : 
                          'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Development Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-3xl font-bold text-white mb-1">
                        {statistics?.codeGeneration.totalLinesGenerated?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-white/60">Lines of Code Generated</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-xl font-bold text-white">
                          {statistics?.codeGeneration.totalGenerated || 0}
                        </div>
                        <div className="text-xs text-white/60">Files Created</div>
                      </div>
                      
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-xl font-bold text-white">
                          {statistics?.codeGeneration.totalApplied || 0}
                        </div>
                        <div className="text-xs text-white/60">Actually Used</div>
                      </div>
                    </div>

                    <div className="text-center p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <div className="text-sm text-indigo-200 mb-1">Estimated Time Saved</div>
                      <div className="text-lg font-bold text-indigo-200">
                        {Math.round((statistics?.codeGeneration.totalLinesGenerated || 0) * 0.5)} minutes
                      </div>
                      <div className="text-xs text-indigo-200/60">
                        Based on ~30 seconds per line
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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

      {/* Custom scrollbar styles */}
      <ScrollbarStyles />
    </>
  );
};

export default EnhancedQAPage;