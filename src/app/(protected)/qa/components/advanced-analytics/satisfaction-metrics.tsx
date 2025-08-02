'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp, Code, TrendingUp } from 'lucide-react';

interface SatisfactionMetricsProps {
  satisfaction?: {
    averageRating: number;
    totalRatings: number;
    helpfulCount: number;
    unhelpfulCount: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
  };
  codeGeneration?: {
    averageSatisfaction: number;
    totalGenerations: number;
    appliedCount: number;
    modifiedCount: number;
    satisfactionDistribution: Array<{ satisfaction: number; count: number }>;
  };
}

export const SatisfactionMetrics: React.FC<SatisfactionMetricsProps> = ({ 
  satisfaction, 
  codeGeneration 
}) => {
  const getRatingPercentage = (rating: number) => {
    if (!satisfaction?.ratingDistribution) return 0;
    const total = satisfaction.ratingDistribution.reduce((sum, item) => sum + item.count, 0);
    const ratingData = satisfaction.ratingDistribution.find(item => item.rating === rating);
    return total > 0 ? Math.round((ratingData?.count || 0) / total * 100) : 0;
  };

  const getSatisfactionPercentage = (satisfactionLevel: number) => {
    if (!codeGeneration?.satisfactionDistribution) return 0;
    const total = codeGeneration.satisfactionDistribution.reduce((sum, item) => sum + item.count, 0);
    const satisfactionData = codeGeneration.satisfactionDistribution.find(item => item.satisfaction === satisfactionLevel);
    return total > 0 ? Math.round((satisfactionData?.count || 0) / total * 100) : 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Response Satisfaction */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5" />
            Response Satisfaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          {satisfaction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {satisfaction.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-white/60">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round((satisfaction.helpfulCount / (satisfaction.helpfulCount + satisfaction.unhelpfulCount)) * 100) || 0}%
                  </div>
                  <div className="text-xs text-white/60">Helpful Rate</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/80">Rating Distribution:</h4>
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-xs text-white/60">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getRatingPercentage(rating)}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/60 w-8">
                      {getRatingPercentage(rating)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-white/60">{satisfaction.helpfulCount} helpful</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">{satisfaction.unhelpfulCount} not helpful</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-white/60">
              <Star className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No satisfaction data yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Generation Metrics */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Code className="h-5 w-5" />
            Code Generation Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {codeGeneration ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">
                    {codeGeneration.averageSatisfaction.toFixed(1)}
                  </div>
                  <div className="text-xs text-white/60">Avg Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round((codeGeneration.appliedCount / codeGeneration.totalGenerations) * 100) || 0}%
                  </div>
                  <div className="text-xs text-white/60">Applied Rate</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/80">Usage Breakdown:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-white/70">Applied:</span>
                    <span className="text-green-400 font-medium">{codeGeneration.appliedCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-white/70">Modified:</span>
                    <span className="text-yellow-400 font-medium">{codeGeneration.modifiedCount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/80">Satisfaction Range:</h4>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="text-center p-2 bg-red-500/20 rounded">
                    <div className="font-medium text-red-300">
                      {getSatisfactionPercentage(3) + getSatisfactionPercentage(2) + getSatisfactionPercentage(1)}%
                    </div>
                    <div className="text-white/60">Poor (1-3)</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-500/20 rounded">
                    <div className="font-medium text-yellow-300">
                      {getSatisfactionPercentage(7) + getSatisfactionPercentage(6) + getSatisfactionPercentage(5) + getSatisfactionPercentage(4)}%
                    </div>
                    <div className="text-white/60">Good (4-7)</div>
                  </div>
                  <div className="text-center p-2 bg-green-500/20 rounded">
                    <div className="font-medium text-green-300">
                      {getSatisfactionPercentage(10) + getSatisfactionPercentage(9) + getSatisfactionPercentage(8)}%
                    </div>
                    <div className="text-white/60">Excellent (8-10)</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-white/60">
              <Code className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No code generation data yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};