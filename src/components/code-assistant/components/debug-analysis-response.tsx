'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, CheckCircle, AlertCircle, ChevronRight, ChevronDown, Copy, Target } from 'lucide-react';
import type { DebugSolution } from '@/components/code-assistant/types';

interface DebugAnalysisResponseProps {
  rootCause?: string;
  solutions: DebugSolution[];
  suspectedFiles: string[];
  investigationSteps: string[];
}

const getPriorityIcon = (priority: DebugSolution['priority']) => {
  switch (priority) {
    case 'high':
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    case 'medium':
      return <Target className="h-4 w-4 text-yellow-400" />;
    case 'low':
      return <CheckCircle className="h-4 w-4 text-green-400" />;
  }
};

const getPriorityColor = (priority: DebugSolution['priority']) => {
  switch (priority) {
    case 'high':
      return 'border-red-500/50 bg-red-500/10';
    case 'medium':
      return 'border-yellow-500/50 bg-yellow-500/10';
    case 'low':
      return 'border-green-500/50 bg-green-500/10';
  }
};

export const DebugAnalysisResponse: React.FC<DebugAnalysisResponseProps> = ({
  rootCause,
  solutions,
  suspectedFiles,
  investigationSteps
}) => {
  const [expandedSolutions, setExpandedSolutions] = useState<Set<number>>(new Set([0]));
  const [expandedSteps, setExpandedSteps] = useState(false);
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

  const toggleSolution = (index: number) => {
    const newExpanded = new Set(expandedSolutions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSolutions(newExpanded);
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Debug Summary */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-4 rounded-lg border border-red-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Bug className="h-5 w-5 text-red-400" />
          <h3 className="font-semibold text-white">Debug Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-blue-400 font-semibold">{solutions.length}</div>
            <div className="text-white/60">Solutions Found</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold">{suspectedFiles.length}</div>
            <div className="text-white/60">Suspected Files</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-semibold">{investigationSteps.length}</div>
            <div className="text-white/60">Investigation Steps</div>
          </div>
        </div>
      </div>

      {/* Root Cause */}
      {rootCause && (
        <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-400" />
              Root Cause Analysis
            </h4>
            <button
              onClick={() => handleCopy(rootCause, 'root-cause')}
              className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
              title="Copy root cause"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <p className="text-white/80 leading-relaxed">{rootCause}</p>
        </div>
      )}

      {/* Solutions */}
      {solutions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-white">Recommended Solutions</h4>
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-lg border ${getPriorityColor(solution.priority)} overflow-hidden`}
            >
              <button
                onClick={() => toggleSolution(index)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getPriorityIcon(solution.priority)}
                  <div className="text-left">
                    <h5 className="font-medium text-white">{solution.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        solution.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        solution.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {solution.priority} priority
                      </span>
                      <span className="text-xs text-white/60">
                        Est. effort: {solution.estimatedEffort}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(solution.description, `solution-${index}`);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                    title="Copy solution"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {expandedSolutions.has(index) ? (
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/60" />
                  )}
                </div>
              </button>

              {expandedSolutions.has(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/10"
                >
                  <div className="p-4">
                    <p className="text-white/80 leading-relaxed">{solution.description}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Suspected Files */}
      {suspectedFiles.length > 0 && (
        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">Suspected Files</h4>
            <button
              onClick={() => handleCopy(suspectedFiles.join('\n'), 'suspected-files')}
              className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
              title="Copy file list"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suspectedFiles.map((file, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm border border-yellow-500/30"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Investigation Steps */}
      {investigationSteps.length > 0 && (
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setExpandedSteps(!expandedSteps)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <h4 className="font-medium text-white">Investigation Steps</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(investigationSteps.join('\n'), 'investigation-steps');
                }}
                className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                title="Copy investigation steps"
              >
                <Copy className="h-3 w-3" />
              </button>
              {expandedSteps ? (
                <ChevronDown className="h-4 w-4 text-white/60" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white/60" />
              )}
            </div>
          </button>

          {expandedSteps && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-4">
                <ol className="space-y-2">
                  {investigationSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-white/80 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {solutions.length === 0 && !rootCause && (
        <div className="text-center py-8">
          <Bug className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-white mb-2">Debug Analysis Incomplete</h3>
          <p className="text-white/60 text-sm">Unable to identify specific solutions. Please provide more details about the issue.</p>
        </div>
      )}
    </div>
  );
};