'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, XCircle, Copy, FileText } from 'lucide-react';
import { DarkCodeBlock } from '@/components/ui/dark-code-block';
import type { ReviewIssue } from '@/components/code-assistant/types';

interface CodeReviewResponseProps {
  issues: ReviewIssue[];
  qualityScore?: number;
  filesReviewed: string[];
  suggestions: Array<{
    type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
    description: string;
    code?: string;
  }>;
}

const getSeverityIcon = (severity: ReviewIssue['severity']) => {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    case 'medium':
      return <Info className="h-4 w-4 text-yellow-400" />;
    case 'low':
      return <CheckCircle className="h-4 w-4 text-blue-400" />;
  }
};

const getSeverityColor = (severity: ReviewIssue['severity']) => {
  switch (severity) {
    case 'critical':
      return 'border-red-500/50 bg-red-500/10';
    case 'high':
      return 'border-orange-500/50 bg-orange-500/10';
    case 'medium':
      return 'border-yellow-500/50 bg-yellow-500/10';
    case 'low':
      return 'border-blue-500/50 bg-blue-500/10';
  }
};

export const CodeReviewResponse: React.FC<CodeReviewResponseProps> = ({
  issues,
  qualityScore,
  filesReviewed,
  suggestions
}) => {
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

  const criticalIssues = issues.filter(issue => issue.severity === 'critical');
  const highIssues = issues.filter(issue => issue.severity === 'high');
  const mediumIssues = issues.filter(issue => issue.severity === 'medium');
  const lowIssues = issues.filter(issue => issue.severity === 'low');

  return (
    <div className="space-y-6 mt-4">
      {/* Review Summary */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Code Review Summary
          </h3>
          {qualityScore && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">Quality Score:</span>
              <span className={`font-semibold ${qualityScore >= 8 ? 'text-green-400' : qualityScore >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                {qualityScore}/10
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-red-400 font-semibold">{criticalIssues.length}</div>
            <div className="text-white/60">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-orange-400 font-semibold">{highIssues.length}</div>
            <div className="text-white/60">High</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold">{mediumIssues.length}</div>
            <div className="text-white/60">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-semibold">{lowIssues.length}</div>
            <div className="text-white/60">Low</div>
          </div>
        </div>

        {filesReviewed.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <span className="text-sm text-white/60">Files reviewed: </span>
            <span className="text-sm text-white/80">{filesReviewed.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Issues List */}
      {issues.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-white">Issues Found</h4>
          {issues.map((issue, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white">{issue.type}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      issue.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                      issue.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  
                  <p className="text-white/80 mb-2">{issue.message}</p>
                  
                  {issue.file && (
                    <div className="text-sm text-white/60 mb-2">
                      <span>File: {issue.file}</span>
                      {issue.line && <span> (Line {issue.line})</span>}
                    </div>
                  )}
                  
                  {issue.suggestion && (
                    <div className="mt-3 p-3 bg-white/5 rounded border border-white/10">
                      <div className="text-sm font-medium text-white/80 mb-1">Suggested Fix:</div>
                      <p className="text-sm text-white/70">{issue.suggestion}</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleCopy(issue.message, `issue-${index}`)}
                  className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                  title="Copy issue description"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-white">Improvement Suggestions</h4>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  suggestion.type === 'security' ? 'bg-red-500/20 text-red-300' :
                  suggestion.type === 'bug_fix' ? 'bg-orange-500/20 text-orange-300' :
                  suggestion.type === 'optimization' ? 'bg-green-500/20 text-green-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {suggestion.type.replace('_', ' ')}
                </span>
                <button
                  onClick={() => handleCopy(suggestion.description, `suggestion-${index}`)}
                  className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <p className="text-white/80 text-sm mb-3">{suggestion.description}</p>
              {suggestion.code && (
                <DarkCodeBlock
                  code={suggestion.code}
                  language="typescript"
                  className="mt-2"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && suggestions.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <h3 className="font-medium text-white mb-2">No Issues Found</h3>
          <p className="text-white/60 text-sm">Your code looks great! No issues were detected in the review.</p>
        </div>
      )}
    </div>
  );
};