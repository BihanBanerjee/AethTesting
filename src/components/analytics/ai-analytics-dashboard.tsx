import React, { useState } from 'react';
import { AnalyticsHeader } from './analytics-header';
import { KeyMetricsGrid } from './key-metrics-grid';
import { IntentDistributionChart } from './intent-distribution-chart';
import { ConfidenceLevelsChart } from './confidence-levels-chart';
import { MostReferencedFiles } from './most-referenced-files';
import { CodeGenerationMetrics } from './code-generation-metrics';
import { RecentInteractions } from './recent-interactions';
import type { AnalyticsData } from './types';
import { transformToChartData } from './utils';

// Mock data - replace with actual API call
const mockAnalytics: AnalyticsData = {
  intentDistribution: [
    { intent: 'code_generation', _count: { intent: 25 }, _avg: { confidence: 0.85 } },
    { intent: 'debug', _count: { intent: 18 }, _avg: { confidence: 0.92 } },
    { intent: 'explain', _count: { intent: 15 }, _avg: { confidence: 0.78 } },
    { intent: 'code_review', _count: { intent: 12 }, _avg: { confidence: 0.88 } },
    { intent: 'code_improvement', _count: { intent: 8 }, _avg: { confidence: 0.81 } },
    { intent: 'question', _count: { intent: 22 }, _avg: { confidence: 0.75 } }
  ],
  codeGeneration: {
    totalGenerated: 45,
    avgSatisfaction: 4.2,
    avgLinesOfCode: 87,
    totalApplied: 32,
    totalModified: 28,
    applicationRate: 0.71
  },
  satisfaction: {
    avgRating: 4.1,
    totalRatings: 89
  },
  mostReferencedFiles: [
    { fileName: 'src/components/ui/button.tsx', queryCount: 15, contextUseCount: 12 },
    { fileName: 'src/lib/utils.ts', queryCount: 12, contextUseCount: 8 },
    { fileName: 'src/app/layout.tsx', queryCount: 10, contextUseCount: 7 },
    { fileName: 'prisma/schema.prisma', queryCount: 9, contextUseCount: 6 },
    { fileName: 'src/server/api/trpc.ts', queryCount: 8, contextUseCount: 5 }
  ],
  recentInteractions: [
    { intent: 'code_generation', confidence: 0.89, helpful: true, rating: 5, responseTime: 2340 },
    { intent: 'debug', confidence: 0.94, helpful: true, rating: 4, responseTime: 1890 },
    { intent: 'explain', confidence: 0.76, helpful: true, rating: 4, responseTime: 1560 },
    { intent: 'code_review', confidence: 0.91, helpful: false, rating: 3, responseTime: 3200 }
  ]
};

const AIAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const analytics = mockAnalytics; // Replace with actual API call
  const chartData = transformToChartData(analytics.intentDistribution);

  return (
    <div className="space-y-6 p-6 text-white">
      <AnalyticsHeader 
        timeRange={timeRange} 
        onTimeRangeChange={setTimeRange} 
      />
      
      <KeyMetricsGrid 
        analytics={analytics} 
        timeRange={timeRange} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IntentDistributionChart chartData={chartData} />
        <ConfidenceLevelsChart chartData={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MostReferencedFiles files={analytics.mostReferencedFiles} />
        <CodeGenerationMetrics codeGeneration={analytics.codeGeneration} />
      </div>

      <RecentInteractions interactions={analytics.recentInteractions} />
    </div>
  );
};

export default AIAnalyticsDashboard;