import type { ComponentType } from 'react';
import { Code, Bug, Lightbulb, Search, Zap, FileText, Wrench } from 'lucide-react';

export interface IntentDistribution {
  intent: string;
  _count: { intent: number };
  _avg: { confidence: number };
}

export interface CodeGenerationData {
  totalGenerated: number;
  avgSatisfaction: number;
  avgLinesOfCode: number;
  totalApplied: number;
  totalModified: number;
  applicationRate: number;
}

export interface SatisfactionData {
  avgRating: number;
  totalRatings: number;
}

export interface FileReference {
  fileName: string;
  queryCount: number;
  contextUseCount: number;
}

export interface RecentInteraction {
  intent: string;
  confidence: number;
  helpful: boolean;
  rating: number;
  responseTime: number;
}

export interface AnalyticsData {
  intentDistribution: IntentDistribution[];
  codeGeneration: CodeGenerationData;
  satisfaction: SatisfactionData;
  mostReferencedFiles: FileReference[];
  recentInteractions: RecentInteraction[];
}

export interface ChartDataItem {
  name: string;
  count: number;
  confidence: number;
  fill: string;
}

export const intentColors: Record<string, string> = {
  code_generation: '#10B981',
  debug: '#EF4444', 
  explain: '#8B5CF6',
  code_review: '#F59E0B',
  code_improvement: '#06B6D4',
  question: '#6B7280',
  refactor: '#EC4899'
};

export const intentIcons: Record<string, ComponentType<{ className?: string }>> = {
  code_generation: Code,
  debug: Bug,
  explain: Lightbulb,
  code_review: Search,
  code_improvement: Zap,
  question: FileText,
  refactor: Wrench
};