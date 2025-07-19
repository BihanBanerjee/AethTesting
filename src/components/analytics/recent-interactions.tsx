import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Star, FileText } from 'lucide-react';
import type { RecentInteraction } from './types';
import { intentIcons } from './types';

interface RecentInteractionsProps {
  interactions: RecentInteraction[];
}

export const RecentInteractions: React.FC<RecentInteractionsProps> = ({
  interactions,
}) => {
  const getIntentIcon = (intent: string) => {
    const Icon = intentIcons[intent] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const formatIntent = (intent: string) => {
    return intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Interactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {interactions.map((interaction, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  {getIntentIcon(interaction.intent)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {formatIntent(interaction.intent)}
                  </p>
                  <p className="text-xs text-white/60">
                    {Math.round(interaction.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= interaction.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/60">
                    {(interaction.responseTime / 1000).toFixed(1)}s
                  </p>
                </div>
                
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    interaction.helpful
                      ? 'border-green-500/30 text-green-300'
                      : 'border-red-500/30 text-red-300'
                  }`}
                >
                  {interaction.helpful ? '👍 Helpful' : '👎 Not helpful'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};