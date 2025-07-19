import type { IntentDistribution, ChartDataItem } from './types';
import { intentColors } from './types';

export const formatIntent = (intent: string): string => {
  return intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const transformToChartData = (intentDistribution: IntentDistribution[]): ChartDataItem[] => {
  return intentDistribution.map(item => ({
    name: formatIntent(item.intent),
    count: item._count.intent,
    confidence: Math.round(item._avg.confidence * 100),
    fill: intentColors[item.intent] || '#6B7280'
  }));
};