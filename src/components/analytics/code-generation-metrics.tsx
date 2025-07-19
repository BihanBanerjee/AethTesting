import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Star } from 'lucide-react';
import type { CodeGenerationData } from './types';

interface CodeGenerationMetricsProps {
  codeGeneration: CodeGenerationData;
}

export const CodeGenerationMetrics: React.FC<CodeGenerationMetricsProps> = ({
  codeGeneration,
}) => {
  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Code className="h-5 w-5" />
          Code Generation Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-white/80">Total Files Generated</span>
            <span className="text-lg font-bold text-white">
              {codeGeneration.totalGenerated}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-white/80">Average Lines per Generation</span>
            <span className="text-lg font-bold text-white">
              {Math.round(codeGeneration.avgLinesOfCode)}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <span className="text-sm text-green-200">Applied to Project</span>
            <span className="text-lg font-bold text-green-200">
              {codeGeneration.totalApplied} ({Math.round(codeGeneration.applicationRate * 100)}%)
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <span className="text-sm text-yellow-200">Modified Before Use</span>
            <span className="text-lg font-bold text-yellow-200">
              {codeGeneration.totalModified} ({Math.round((codeGeneration.totalModified / codeGeneration.totalGenerated) * 100)}%)
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <span className="text-sm text-blue-200">Average Satisfaction</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-200">
                {codeGeneration.avgSatisfaction}/5
              </span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= codeGeneration.avgSatisfaction
                        ? 'text-yellow-400 fill-current'
                        : 'text-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};