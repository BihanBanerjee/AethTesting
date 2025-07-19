import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCode } from 'lucide-react';
import { ResultItem } from './result-item';
import type { GenerationResultsListProps } from '../shared/types';

export const GenerationResultsList: React.FC<GenerationResultsListProps> = ({
  results,
  activeResult,
  onResultSelect,
  onApplyChanges
}) => {
  const handleResultToggle = (id: string) => {
    onResultSelect(activeResult === id ? null : id);
  };

  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Generated Results</span>
          {results.length > 0 && (
            <Badge variant="outline" className="border-white/20 text-white/60">
              {results.length} results
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {results.length === 0 ? (
          <div className="p-6 text-center text-white/60">
            <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No code generated yet. Start by describing what you want to build!</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {results.map((result) => (
              <ResultItem
                key={result.id}
                result={result}
                isActive={activeResult === result.id}
                onToggle={() => handleResultToggle(result.id)}
                onApplyChanges={onApplyChanges}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};