'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface InteractionTrendsProps {
  interactions?: Array<{
    id: string;
    intent: string;
    query: string;
    confidence: number;
    rating?: number;
    helpful?: boolean;
    createdAt: Date;
    responseTime?: number;
  }>;
}

export const InteractionTrends: React.FC<InteractionTrendsProps> = ({ interactions }) => {
  if (!interactions || interactions.length === 0) {
    return (
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Recent Interactions Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No recent interactions</p>
            <p className="text-sm mt-2">Start asking questions to see interaction trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      'code_generation': 'bg-green-500/20 text-green-300 border-green-500/30',
      'debug': 'bg-red-500/20 text-red-300 border-red-500/30',
      'review': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'explain': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'improve': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'refactor': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'question': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[intent] || colors['question'];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          Recent Interactions Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactions.slice(0, 10).map((interaction, index) => (
            <div 
              key={interaction.id} 
              className="relative pl-8 pb-4 border-l-2 border-white/20 last:border-l-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-[-5px] top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white/20"></div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getIntentColor(interaction.intent)}>
                      {interaction.intent.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(interaction.createdAt))} ago</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getConfidenceColor(interaction.confidence)}`}>
                      {Math.round(interaction.confidence * 100)}%
                    </span>
                    {interaction.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-white/80">{interaction.rating}/5</span>
                      </div>
                    )}
                    {interaction.helpful !== undefined && (
                      <span className={`text-xs ${interaction.helpful ? 'text-green-400' : 'text-red-400'}`}>
                        {interaction.helpful ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-white/80 line-clamp-2">
                  {interaction.query}
                </div>
                
                {interaction.responseTime && (
                  <div className="text-xs text-white/50">
                    Response time: {(interaction.responseTime / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {interactions.length > 10 && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-sm text-white/60">
              Showing 10 most recent interactions ({interactions.length} total)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};