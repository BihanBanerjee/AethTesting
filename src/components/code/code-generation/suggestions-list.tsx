import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { SuggestionsListProps } from '../shared/types';
import { getSeverityColor } from '../shared/utils';

export const SuggestionsList: React.FC<SuggestionsListProps> = ({ suggestions }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4">
      <h5 className="font-medium text-white/90 mb-2">
        Additional Suggestions
      </h5>
      <div className="space-y-2">
        {suggestions.map(suggestion => (
          <div 
            key={suggestion.id}
            className="p-2 rounded bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white/80">
                Line {suggestion.line} - {suggestion.type}
              </span>
              <Badge 
                variant="outline" 
                className={`text-xs ${getSeverityColor(suggestion.severity)}`}
              >
                {suggestion.severity}
              </Badge>
            </div>
            <p className="text-xs text-white/70">
              {suggestion.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};