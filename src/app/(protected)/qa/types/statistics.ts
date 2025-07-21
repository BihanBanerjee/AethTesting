// Statistics interface matching the backend API response

export interface IntentDistribution {
  intent: string;
  _count: { intent: number };
  _avg: { confidence: number };
}

export interface CodeGenerationStats {
  totalGenerated: number;
  avgSatisfaction: number;
  avgLinesOfCode: number;
  totalApplied: number;
  totalModified: number;
  applicationRate: number;
  totalLinesGenerated: number;
}

export interface SatisfactionStats {
  avgRating: number;
  totalRatings: number;
  average: number;
}

export interface PerformanceStats {
  avgProcessingTime: number;
}

export interface MostReferencedFile {
  fileName: string;
  queryCount: number;
  contextUseCount: number;
  lastQueried: Date;
}

export interface RecentInteraction {
  intent: string;
  confidence: number;
  helpful: boolean;
  rating: number;
  createdAt: Date;
  responseTime: number;
}

export interface ConfidenceStats {
  average: number;
}

// Main Statistics interface matching the backend API response
export interface Statistics {
  total: number;
  timeRange: string;
  
  // Intent distribution
  intentDistribution: Record<string, number>;
  
  // Code generation statistics
  codeGeneration: CodeGenerationStats;
  
  // Satisfaction statistics
  satisfaction: SatisfactionStats;
  
  // Performance statistics
  performance: PerformanceStats;
  
  // Confidence statistics
  confidence: ConfidenceStats;
  
  // Most referenced files
  mostReferencedFiles?: MostReferencedFile[];
  
  // Recent interactions
  recentInteractions?: RecentInteraction[];
}

// Type guard for Statistics
export function isStatistics(value: unknown): value is Statistics {
  return typeof value === 'object' && 
         value !== null && 
         'total' in value &&
         'timeRange' in value &&
         typeof value.total === 'number' &&
         typeof value.timeRange === 'string';
}

// Helper function to safely get code generation rate
export function getCodeGenerationRate(stats: Statistics): number {
  return stats.codeGeneration?.applicationRate || 0;
}

// Helper function to safely get satisfaction average
export function getSatisfactionAverage(stats: Statistics): number {
  return stats.satisfaction?.average || 0;
}

// Helper function to safely get performance average
export function getPerformanceAverage(stats: Statistics): number {
  return stats.performance?.avgProcessingTime || 0;
}