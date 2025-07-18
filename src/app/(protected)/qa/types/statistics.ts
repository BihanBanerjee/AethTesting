export interface Statistics {
  total: number;
  timeRange: string;
  codeGeneration: {
    totalGenerated: number;
    totalApplied: number;
    applicationRate: number;
    totalLinesGenerated: number;
  };
  satisfaction: {
    average: number;
    totalRatings: number;
  };
  confidence: {
    average: number;
  };
  performance: {
    avgProcessingTime: number;
  };
  intentDistribution: Record<string, number>;
}