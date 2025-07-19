import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Code, Star, Clock } from 'lucide-react';
import type { AnalyticsData } from './types';

interface KeyMetricsGridProps {
  analytics: AnalyticsData;
  timeRange: string;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({
  analytics,
  timeRange,
}) => {
  const totalInteractions = analytics.intentDistribution.reduce((sum, item) => sum + item._count.intent, 0);
  const avgResponseTime = Math.round(
    analytics.recentInteractions.reduce((sum, i) => sum + i.responseTime, 0) / 
    analytics.recentInteractions.length / 1000
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="glassmorphism border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Total Interactions
          </CardTitle>
          <Activity className="h-4 w-4 text-white/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {totalInteractions}
          </div>
          <p className="text-xs text-white/60">
            +12% from last {timeRange}
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
            {analytics.codeGeneration.totalGenerated}
          </div>
          <p className="text-xs text-white/60">
            {Math.round(analytics.codeGeneration.applicationRate * 100)}% applied rate
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
            {analytics.satisfaction.avgRating}/5
          </div>
          <p className="text-xs text-white/60">
            From {analytics.satisfaction.totalRatings} ratings
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
            {avgResponseTime}s
          </div>
          <p className="text-xs text-white/60">
            -15% improvement
          </p>
        </CardContent>
      </Card>
    </div>
  );
};