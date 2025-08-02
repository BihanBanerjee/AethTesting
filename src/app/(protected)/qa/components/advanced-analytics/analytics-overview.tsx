'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/trpc/react';
import { InteractionTrends } from './interaction-trends';
import { FileUsageAnalytics } from './file-usage-analytics';
import { SatisfactionMetrics } from './satisfaction-metrics';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Star, 
  ThumbsUp,
  Code,
  Activity
} from 'lucide-react';

interface AnalyticsOverviewProps {
  projectId: string;
  timeRange?: 'day' | 'week' | 'month' | 'all';
}

export const AdvancedAnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  projectId,
  timeRange = 'month'
}) => {
  const { data: analytics, isLoading } = api.project.getQuestionAnalytics.useQuery({
    projectId,
    timeRange
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glassmorphism border-white/20">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
                <div className="h-24 bg-white/10 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-white/60">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No analytics data available</p>
        <p className="text-sm mt-2">Start using the AI assistant to see detailed analytics here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intent Distribution with Advanced Metrics */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Intent Distribution & Confidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.intentDistribution?.map((intent: any, index: number) => (
              <div key={intent.intent || index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-indigo-400" />
                    <span className="font-medium text-white capitalize">
                      {intent.intent?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-white/80">
                    {intent._count?.intent || 0} uses
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/70">
                    Avg Confidence: {Math.round((intent._avg?.confidence || 0) * 100)}%
                  </div>
                  <div className="w-20 bg-white/20 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((intent._avg?.confidence || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-6 text-white/60">
                <p>No intent data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Most Referenced Files */}
      <FileUsageAnalytics files={analytics.mostReferencedFiles?.map((file: any) => ({
        ...file,
        lastQueried: file.lastQueried || new Date()
      }))} />
      
      {/* Recent Interactions Timeline */}
      <InteractionTrends interactions={analytics.recentInteractions?.map((interaction: any) => ({
        id: interaction.id || 'unknown',
        intent: interaction.intent,
        query: interaction.query || 'N/A',
        confidence: interaction.confidence || 0,
        rating: interaction.rating,
        helpful: interaction.helpful,
        createdAt: interaction.createdAt,
        responseTime: interaction.responseTime
      }))} />
      
      {/* Satisfaction Breakdown */}
      <SatisfactionMetrics 
        satisfaction={analytics.satisfaction ? {
          averageRating: analytics.satisfaction.avgRating || 0,
          totalRatings: analytics.satisfaction.totalRatings || 0,
          helpfulCount: 0,
          unhelpfulCount: 0,
          ratingDistribution: []
        } : undefined}
        codeGeneration={analytics.codeGeneration ? {
          averageSatisfaction: analytics.codeGeneration.avgSatisfaction || 0,
          totalGenerations: analytics.codeGeneration.totalGenerated || 0,
          appliedCount: analytics.codeGeneration.totalApplied || 0,
          modifiedCount: analytics.codeGeneration.totalModified || 0,
          satisfactionDistribution: []
        } : undefined}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {analytics.recentInteractions?.length || 0}
                </div>
                <div className="text-xs text-white/60">Total Interactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {analytics.satisfaction?.avgRating ? analytics.satisfaction.avgRating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs text-white/60">Average Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  N/A
                </div>
                <div className="text-xs text-white/60">Helpful Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};