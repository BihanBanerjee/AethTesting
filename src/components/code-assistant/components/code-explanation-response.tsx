'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, BarChart3, Copy, ChevronRight, ChevronDown } from 'lucide-react';

interface CodeExplanationResponseProps {
  overview: string;
  keyPoints: string[];
  complexity?: number;
  recommendations: string[];
}

const getComplexityColor = (complexity: number) => {
  if (complexity <= 3) return 'text-green-400';
  if (complexity <= 6) return 'text-yellow-400';
  if (complexity <= 8) return 'text-orange-400';
  return 'text-red-400';
};

const getComplexityLabel = (complexity: number) => {
  if (complexity <= 3) return 'Simple';
  if (complexity <= 6) return 'Moderate';
  if (complexity <= 8) return 'Complex';
  return 'Very Complex';
};

export const CodeExplanationResponse: React.FC<CodeExplanationResponseProps> = ({
  overview,
  keyPoints,
  complexity,
  recommendations
}) => {
  const [expandedKeyPoints, setExpandedKeyPoints] = useState(true);
  const [expandedRecommendations, setExpandedRecommendations] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Explanation Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-lg border border-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-400" />
            Code Explanation
          </h3>
          {complexity && (
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-white/60" />
              <span className="text-sm text-white/60">Complexity:</span>
              <span className={`font-semibold ${getComplexityColor(complexity)}`}>
                {complexity}/10 ({getComplexityLabel(complexity)})
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>{keyPoints.length} key points</span>
          <span>{recommendations.length} recommendations</span>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Overview</h4>
          <button
            onClick={() => handleCopy(overview, 'overview')}
            className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
            title="Copy overview"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <p className="text-white/80 leading-relaxed">{overview}</p>
      </div>

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setExpandedKeyPoints(!expandedKeyPoints)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <h4 className="font-medium text-white flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              Key Points ({keyPoints.length})
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(keyPoints.join('\n'), 'key-points');
                }}
                className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                title="Copy key points"
              >
                <Copy className="h-3 w-3" />
              </button>
              {expandedKeyPoints ? (
                <ChevronDown className="h-4 w-4 text-white/60" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/60" />
              )}
            </div>
          </button>

          {expandedKeyPoints && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-4">
                <ul className="space-y-3">
                  {keyPoints.map((point, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-white/80 text-sm leading-relaxed">{point}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setExpandedRecommendations(!expandedRecommendations)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <h4 className="font-medium text-white flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-400" />
              Recommendations ({recommendations.length})
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(recommendations.join('\n'), 'recommendations');
                }}
                className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                title="Copy recommendations"
              >
                <Copy className="h-3 w-3" />
              </button>
              {expandedRecommendations ? (
                <ChevronDown className="h-4 w-4 text-white/60" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/60" />
              )}
            </div>
          </button>

          {expandedRecommendations && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-4">
                <ul className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-white/80 text-sm leading-relaxed">{recommendation}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-sm text-white/60">
        <div className="flex items-center gap-4">
          <span>Overview: 1 section</span>
          <span>Key Points: {keyPoints.length}</span>
          <span>Recommendations: {recommendations.length}</span>
        </div>
        {complexity && (
          <div className="flex items-center gap-2">
            <span>Complexity Score:</span>
            <span className={getComplexityColor(complexity)}>
              {complexity}/10
            </span>
          </div>
        )}
      </div>
    </div>
  );
};