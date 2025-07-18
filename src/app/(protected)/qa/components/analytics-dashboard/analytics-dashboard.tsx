'use client'

import React from 'react';
import { TrendingUp, BarChart3, Code, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Statistics } from '../../types/statistics';
import { getCodeGenerationRate, getSatisfactionAverage, getPerformanceAverage } from '../../types/statistics';

interface AnalyticsDashboardProps {
  statistics: Statistics | null | undefined;
  filters: {
    timeRange: 'day' | 'week' | 'month' | 'all';
  };
  onFilterChange: (filters: {
    timeRange?: 'day' | 'week' | 'month' | 'all';
  }) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  statistics, 
  filters, 
  onFilterChange 
}) => {
  return (
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
              {Math.round(getCodeGenerationRate(statistics || {} as Statistics) * 100)}%
            </div>
            <p className="text-xs text-white/60">
              {statistics?.codeGeneration?.totalApplied || 0} of {statistics?.codeGeneration?.totalGenerated || 0} applied
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
              {Math.round((statistics?.confidence?.average || 0) * 100)}%
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
                  {Math.round(getCodeGenerationRate(statistics || {} as Statistics) * 100)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="text-sm text-blue-200">Average Satisfaction</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-200">
                    {getSatisfactionAverage(statistics || {} as Statistics).toFixed(1) || 'N/A'}/5
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= getSatisfactionAverage(statistics || {} as Statistics)
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
                  {getPerformanceAverage(statistics || {} as Statistics) ? 
                    `${(getPerformanceAverage(statistics || {} as Statistics) / 1000).toFixed(1)}s` : 
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
  );
};

export default AnalyticsDashboard;