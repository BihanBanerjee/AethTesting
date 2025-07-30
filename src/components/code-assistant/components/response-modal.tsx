'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Copy, Download, ExternalLink } from 'lucide-react';
import { DarkCodeBlock } from '@/components/ui/dark-code-block';
import { DarkMarkdown } from '@/components/ui/dark-markdown';
import type { Message } from '@/components/code-assistant/types';

interface ResponseModalProps {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
}

export const ResponseModal: React.FC<ResponseModalProps> = ({
  message,
  isOpen,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState<string>('response');

  if (!isOpen) return null;

  const metadata = message.metadata;

  const extractStringContent = (content: any): string => {
    if (typeof content === 'string') return content;
    if (content && typeof content === 'object') {
      if ('curr' in content) return String(content.curr || '');
      if ('value' in content) return String(content.value || '');
    }
    return String(content || '');
  };

  const contentText = extractStringContent(message.content);

  const sections = [
    {
      id: 'response',
      label: 'Response',
      content: contentText
    }
  ];

  // Add code section if there's generated code
  if (metadata?.generatedCode) {
    sections.push({
      id: 'code',
      label: 'Generated Code',
      content: metadata.generatedCode
    });
  }

  // Add analysis section for specific response types
  if (metadata?.responseType === 'code_review' && metadata.reviewMetadata) {
    sections.push({
      id: 'analysis',
      label: 'Code Review',
      content: `Quality Score: ${metadata.reviewMetadata.qualityScore || 'N/A'}\n\nIssues Found: ${metadata.reviewMetadata.totalIssues}\n\nFiles Reviewed: ${metadata.reviewMetadata.filesReviewed.join(', ')}`
    });
  }

  if (metadata?.responseType === 'debug' && metadata.debugMetadata) {
    sections.push({
      id: 'analysis',
      label: 'Debug Analysis',
      content: `Root Cause: ${metadata.debugMetadata.rootCause || 'Not identified'}\n\nSolutions Available: ${metadata.debugMetadata.solutionsCount}\n\nSuspected Files: ${metadata.debugMetadata.suspectedFiles.join(', ')}`
    });
  }

  const activeContent = sections.find(s => s.id === activeSection)?.content || contentText;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">
                {message.intent ? `${message.intent.replace('_', ' ')} Response` : 'AI Response'}
              </h2>
              {message.metadata?.responseType && (
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30">
                  {message.metadata.responseType.replace('_', ' ')}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(activeContent)}
                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white/80 transition-colors"
                title="Copy content"
              >
                <Copy className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => {
                  const blob = new Blob([activeContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ai-response-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white/80 transition-colors"
                title="Download content"
              >
                <Download className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white/80 transition-colors"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Section Tabs */}
          {sections.length > 1 && (
            <div className="flex items-center gap-1 px-6 py-3 border-b border-white/10 bg-white/5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          )}

          {/* Modal Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeSection === 'code' && metadata?.generatedCode ? (
                    <div className="h-full">
                      <DarkCodeBlock
                        code={metadata.generatedCode}
                        language={metadata.language || 'typescript'}
                        filename={`generated-code.${metadata.language === 'typescript' ? 'ts' : 'js'}`}
                        showLineNumbers={true}
                        className="h-full"
                      />
                      
                      {/* Code Metadata */}
                      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Language:</span>
                            <span className="ml-2 text-white/80">{metadata.language || 'typescript'}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Size:</span>
                            <span className="ml-2 text-white/80">{metadata.generatedCode.length} characters</span>
                          </div>
                          <div>
                            <span className="text-white/60">Lines:</span>
                            <span className="ml-2 text-white/80">{metadata.generatedCode.split('\n').length}</span>
                          </div>
                        </div>
                        
                        {metadata.warnings && metadata.warnings.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <h4 className="font-medium text-yellow-300 mb-2">Warnings</h4>
                            <ul className="space-y-1">
                              {metadata.warnings.map((warning, index) => (
                                <li key={index} className="text-sm text-yellow-200/80">
                                  • {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {metadata.dependencies && metadata.dependencies.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <h4 className="font-medium text-blue-300 mb-2">Dependencies</h4>
                            <div className="flex flex-wrap gap-2">
                              {metadata.dependencies.map((dep, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm border border-blue-500/30"
                                >
                                  {dep}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <DarkMarkdown content={activeContent} className="full-screen-response" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>Response Time: {message.timestamp.toLocaleTimeString()}</span>
              {message.confidence && (
                <span>Confidence: {Math.round(message.confidence * 100)}%</span>
              )}
              {metadata?.files && metadata.files.length > 0 && (
                <span>Files: {metadata.files.length}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSection(sections[0]?.id || 'response')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/80 transition-colors"
              >
                Reset View
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-sm text-indigo-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};