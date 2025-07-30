'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Target, AlertTriangle, CheckCircle, Copy, ChevronRight, ChevronDown } from 'lucide-react';
import { DarkCodeBlock } from '@/components/ui/dark-code-block';

interface RefactorResponseProps {
  refactoredCode?: string;
  refactoringPlan?: {
    goals: string[];
    steps: string[];
    risks: string[];
  };
  language?: string;
}

export const RefactorResponse: React.FC<RefactorResponseProps> = ({
  refactoredCode,
  refactoringPlan,
  language = 'typescript'
}) => {
  const [expandedPlan, setExpandedPlan] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState(false);
  const [expandedRisks, setExpandedRisks] = useState(false);
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
      {/* Refactor Summary */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-white">Code Refactoring Results</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-center">
          <div>
            <div className="text-green-400 font-semibold">
              {refactoringPlan?.goals.length || 0}
            </div>
            <div className="text-white/60">Goals</div>
          </div>
          <div>
            <div className="text-blue-400 font-semibold">
              {refactoringPlan?.steps.length || 0}
            </div>
            <div className="text-white/60">Steps</div>
          </div>
          <div>
            <div className="text-yellow-400 font-semibold">
              {refactoringPlan?.risks.length || 0}
            </div>
            <div className="text-white/60">Risks</div>
          </div>
        </div>
      </div>

      {/* Refactored Code */}
      {refactoredCode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Refactored Code</h4>
            <button
              onClick={() => handleCopy(refactoredCode, 'refactored-code')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white/80 flex items-center gap-2"
            >
              <Copy className="h-3 w-3" />
              {copied === 'refactored-code' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <DarkCodeBlock
            code={refactoredCode}
            language={language}
            className="max-h-96 overflow-y-auto"
          />
        </div>
      )}

      {/* Refactoring Plan */}
      {refactoringPlan && (
        <div className="space-y-4">
          {/* Goals */}
          {refactoringPlan.goals.length > 0 && (
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedGoals(!expandedGoals)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-400" />
                  Refactoring Goals ({refactoringPlan.goals.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(refactoringPlan.goals.join('\n'), 'goals');
                    }}
                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                    title="Copy goals"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {expandedGoals ? (
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/60" />
                  )}
                </div>
              </button>

              {expandedGoals && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/10"
                >
                  <div className="p-4">
                    <ul className="space-y-2">
                      {refactoringPlan.goals.map((goal, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-white/80 text-sm">{goal}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Steps */}
          {refactoringPlan.steps.length > 0 && (
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedSteps(!expandedSteps)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="font-medium text-white flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-400" />
                  Implementation Steps ({refactoringPlan.steps.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(refactoringPlan.steps.join('\n'), 'steps');
                    }}
                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                    title="Copy steps"
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
                    <ol className="space-y-3">
                      {refactoringPlan.steps.map((step, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-white/80 text-sm">{step}</span>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Risks */}
          {refactoringPlan.risks.length > 0 && (
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedRisks(!expandedRisks)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="font-medium text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  Potential Risks ({refactoringPlan.risks.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(refactoringPlan.risks.join('\n'), 'risks');
                    }}
                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                    title="Copy risks"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {expandedRisks ? (
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/60" />
                  )}
                </div>
              </button>

              {expandedRisks && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/10"
                >
                  <div className="p-4">
                    <ul className="space-y-2">
                      {refactoringPlan.risks.map((risk, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-white/80 text-sm">{risk}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {!refactoredCode && !refactoringPlan && (
        <div className="text-center py-8">
          <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-white mb-2">No Refactoring Results</h3>
          <p className="text-white/60 text-sm">Unable to generate refactoring suggestions. Please provide more specific requirements.</p>
        </div>
      )}
    </div>
  );
};