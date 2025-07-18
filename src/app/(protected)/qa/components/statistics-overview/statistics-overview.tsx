'use client'

import React from 'react';
import { BarChart3, Star, Code, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticsOverviewProps {
  statistics: any;
}

const StatisticsOverview: React.FC<StatisticsOverviewProps> = ({ statistics }) => {
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

export default StatisticsOverview;