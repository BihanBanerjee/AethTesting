'use client'

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import type { SuggestionsSectionProps } from '../types/message-display.types';

export const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({
  suggestions
}) => {
  const getSuggestionBadgeStyle = (type: string) => {
    switch (type) {
      case 'improvement':
        return 'border-green-500/30 text-green-300';
      case 'bug_fix':
        return 'border-red-500/30 text-red-300';
      case 'security':
        return 'border-orange-500/30 text-orange-300';
      default:
        return 'border-blue-500/30 text-blue-300';
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-white mb-2 flex items-center">
        <Sparkles className="h-4 w-4 mr-1" />
        AI Suggestions
      </h4>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <GlassmorphicCard key={index} className="p-3 bg-white/5">
            <div className="flex items-start gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${getSuggestionBadgeStyle(suggestion.type)}`}
              >
                {suggestion.type.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-white/80 mt-1">{suggestion.description}</p>
            {suggestion.code && (
              <CodeBlock
                code={suggestion.code}
                language="typescript"
                className="mt-2"
                actions={{ copy: true }}
              />
            )}
          </GlassmorphicCard>
        ))}
      </div>
    </div>
  );
};