'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Code, FileText, Bug, RefreshCw, BookOpen, AlertTriangle } from 'lucide-react';
import { DarkCodeBlock } from '@/components/ui/dark-code-block';
import { EnhancedResponseDisplay } from '@/components/code-assistant/enhanced-response/enhanced-response-display';
import type { Message } from '@/components/code-assistant/types';

interface ResponseTabsProps {
  message: Message;
  children: React.ReactNode;
}

type TabType = 'response' | 'code' | 'issues' | 'files' | 'analysis' | 'steps';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  count?: number;
  priority: number;
}

const getTabsForResponse = (message: Message): Tab[] => {
  const tabs: Tab[] = [
    {
      id: 'response',
      label: 'Response',
      icon: <MessageSquareText className="h-4 w-4" />,
      priority: 1
    }
  ];

  const metadata = message.metadata;
  if (!metadata) return tabs;

  // Add Code tab for responses with generated code
  if (metadata.generatedCode || metadata.responseType === 'code_generation') {
    tabs.push({
      id: 'code',
      label: 'Code',
      icon: <Code className="h-4 w-4" />,
      priority: 2
    });
  }

  // Add Issues tab for code review responses
  if (metadata.responseType === 'code_review' && metadata.reviewMetadata) {
    tabs.push({
      id: 'issues',
      label: 'Issues',
      icon: <AlertTriangle className="h-4 w-4" />,
      count: metadata.reviewMetadata.totalIssues,
      priority: 2
    });
  }

  // Add Analysis tab for debug responses
  if (metadata.responseType === 'debug' && metadata.debugMetadata) {
    tabs.push({
      id: 'analysis',
      label: 'Analysis',
      icon: <Bug className="h-4 w-4" />,
      count: metadata.debugMetadata.solutionsCount,
      priority: 2
    });
  }

  // Add Steps tab for refactor responses
  if (metadata.responseType === 'refactor' && metadata.refactorMetadata?.refactoringPlan) {
    tabs.push({
      id: 'steps',
      label: 'Plan',
      icon: <RefreshCw className="h-4 w-4" />,
      count: metadata.refactorMetadata.refactoringPlan.steps.length,
      priority: 2
    });
  }

  // Add Files tab for responses with file references
  if (metadata.files && metadata.files.length > 0) {
    tabs.push({
      id: 'files',
      label: 'Files',
      icon: <FileText className="h-4 w-4" />,
      count: metadata.files.length,
      priority: 3
    });
  }

  return tabs.sort((a, b) => a.priority - b.priority);
};

const TabButton: React.FC<{
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}> = ({ tab, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
      isActive
        ? 'bg-white/10 text-white border border-white/20'
        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
    }`}
  >
    {tab.icon}
    <span>{tab.label}</span>
    {tab.count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${
        isActive
          ? 'bg-white/20 text-white'
          : 'bg-white/10 text-white/60'
      }`}>
        {tab.count}
      </span>
    )}
    
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </button>
);

export const ResponseTabs: React.FC<ResponseTabsProps> = ({ message, children }) => {
  const tabs = getTabsForResponse(message);
  const [activeTab, setActiveTab] = useState<TabType>(tabs[0]?.id || 'response');

  // Don't render tabs if there's only one tab
  if (tabs.length <= 1) {
    return <div>{children}</div>;
  }

  const renderTabContent = () => {
    const metadata = message.metadata;

    switch (activeTab) {
      case 'response':
        return children;

      case 'code':
        if (metadata?.generatedCode || message.content) {
          // Use the full message content if available, otherwise fall back to generatedCode
          const contentToDisplay = typeof message.content === 'string' 
            ? message.content 
            : metadata?.generatedCode || '';
          
          // Debug: Log what content we're about to display
          console.log('🔍 ResponseTabs Code tab - content analysis:');
          console.log('  - Message content type:', typeof message.content);
          console.log('  - Message content length:', typeof message.content === 'string' ? message.content.length : 'Not string');
          console.log('  - Metadata generatedCode length:', metadata?.generatedCode?.length || 0);
          console.log('  - Final contentToDisplay length:', contentToDisplay.length);
          console.log('  - Will use EnhancedResponseDisplay:', contentToDisplay.length > 500);
          
          // If we have substantial content, use EnhancedResponseDisplay for better handling
          if (contentToDisplay.length > 500) {
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Generated Code</h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    {metadata?.language && (
                      <span className="px-2 py-1 bg-white/10 rounded">{metadata.language}</span>
                    )}
                    <span className="text-xs text-white/40">Full content view</span>
                  </div>
                </div>
                
                <EnhancedResponseDisplay 
                  content={contentToDisplay} 
                  messageType="assistant"
                />
                
                {metadata?.warnings && metadata.warnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-300 mb-2">Warnings</h4>
                    <ul className="space-y-1 text-sm text-yellow-200/80">
                      {metadata.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          } else {
            // For shorter content, use the original DarkCodeBlock approach
            const processedCode = contentToDisplay
              .replace(/\\n/g, '\n')      // Convert \n to actual newlines
              .replace(/\\r/g, '\r')      // Convert \r to carriage returns  
              .replace(/\\t/g, '\t')      // Convert \t to tabs
              .replace(/\\"/g, '"')       // Convert \" to quotes
              .replace(/\\\\/g, '\\');    // Convert \\ to single backslash
              
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Generated Code</h3>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    {metadata?.language && (
                      <span className="px-2 py-1 bg-white/10 rounded">{metadata.language}</span>
                    )}
                  </div>
                </div>
                <DarkCodeBlock
                  code={processedCode}
                  language={metadata?.language || 'typescript'}
                  showLineNumbers={true}
                />
                {metadata?.warnings && metadata.warnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-300 mb-2">Warnings</h4>
                    <ul className="space-y-1 text-sm text-yellow-200/80">
                      {metadata.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          }
        }
        return <div className="text-white/60">No code generated</div>;

      case 'issues':
        if (metadata?.reviewMetadata?.issues) {
          return (
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Code Issues ({metadata.reviewMetadata.totalIssues})</h3>
              {metadata.reviewMetadata.issues.map((issue, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      issue.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                      issue.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="font-medium text-white">{issue.type}</span>
                  </div>
                  <p className="text-white/80 text-sm">{issue.message}</p>
                  {issue.suggestion && (
                    <div className="mt-2 p-2 bg-white/5 rounded text-sm text-white/70">
                      <strong>Suggestion:</strong> {issue.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return <div className="text-white/60">No issues found</div>;

      case 'analysis':
        if (metadata?.debugMetadata) {
          return (
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Debug Analysis</h3>
              {metadata.debugMetadata.rootCause && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <h4 className="font-medium text-orange-300 mb-2">Root Cause</h4>
                  <p className="text-white/80 text-sm">{metadata.debugMetadata.rootCause}</p>
                </div>
              )}
              {metadata.debugMetadata.solutions && metadata.debugMetadata.solutions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Solutions ({metadata.debugMetadata.solutions.length})</h4>
                  {metadata.debugMetadata.solutions.map((solution, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <h5 className="font-medium text-white mb-1">{solution.title}</h5>
                      <p className="text-white/80 text-sm mb-2">{solution.description}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          solution.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          solution.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {solution.priority} priority
                        </span>
                        <span className="text-white/60">Est: {solution.estimatedEffort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return <div className="text-white/60">No analysis available</div>;

      case 'steps':
        if (metadata?.refactorMetadata?.refactoringPlan) {
          const plan = metadata.refactorMetadata.refactoringPlan;
          return (
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Refactoring Plan</h3>
              
              {plan.goals.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Goals</h4>
                  <ul className="space-y-1">
                    {plan.goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                        <span className="text-green-400">•</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.steps.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Implementation Steps</h4>
                  <ol className="space-y-1">
                    {plan.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {plan.risks.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Risks</h4>
                  <ul className="space-y-1">
                    {plan.risks.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                        <span className="text-yellow-400">⚠</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        return <div className="text-white/60">No plan available</div>;

      case 'files':
        if (metadata?.files && metadata.files.length > 0) {
          return (
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Referenced Files ({metadata.files.length})</h3>
              <div className="space-y-2">
                {metadata.files.map((file, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span className="font-mono text-sm text-white/80">{file}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return <div className="text-white/60">No files referenced</div>;

      default:
        return children;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/10">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
};