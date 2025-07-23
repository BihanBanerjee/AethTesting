// src/components/ui/response-modal.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Download,
  MessageSquare,
  Sparkles,
  Loader2,
  Code,
  FileText,
  CheckCircle,
  AlertCircle,
  InfoIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import { DarkMarkdown } from '@/components/ui/dark-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import { CodeContextTab } from '@/components/ui/code-context-tab';
import { CompactQuestionDisplay } from '@/components/ui/compact-question-display';
import type { EnhancedResponse, ActiveTab } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: EnhancedResponse | null;
  question: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  projectId: string;
  isStreaming?: boolean;
  streamingContent?: string;
}

interface StreamingTextProps {
  text: string;
  isComplete: boolean;
  speed?: number;
}

const StreamingText: React.FC<StreamingTextProps> = ({ 
  text, 
  isComplete, 
  speed = 30 
}) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (isComplete) {
      setDisplayedText(text);
      return;
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [text, currentIndex, isComplete, speed]);

  return (
    <div className="response-content">
      <DarkMarkdown content={displayedText} />
      {!isComplete && currentIndex < text.length && (
        <motion.span
          className="inline-block w-2 h-5 bg-indigo-400 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export const ResponseModal: React.FC<ResponseModalProps> = ({
  isOpen,
  onClose,
  response,
  question,
  activeTab,
  onTabChange,
  projectId,
  isStreaming = false,
  streamingContent = ''
}) => {
  // Modal is rendered inside MainContent which already handles sidebar positioning

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResponse = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getResponseTypeIcon = () => {
    if (!response?.type) return <MessageSquare className="h-3 w-3 text-white/60" />;
    switch (response.type) {
      case 'code': return <Code className="h-3 w-3 text-green-400" />;
      case 'review': return <CheckCircle className="h-3 w-3 text-orange-400" />;
      case 'debug': return <AlertCircle className="h-3 w-3 text-red-400" />;
      default: return <FileText className="h-3 w-3 text-blue-400" />;
    }
  };


  const modalContent = response?.content || streamingContent;
  const isContentReady = response !== null || streamingContent.length > 0;

  // Ensure response tab is selected when modal first opens with content
  useEffect(() => {
    if (isOpen && response && activeTab !== 'response' && activeTab !== 'code' && activeTab !== 'files') {
      onTabChange('response');
    }
  }, [isOpen, response]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full h-full"
          >
            <GlassmorphicCard className="h-full flex flex-col overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40 backdrop-blur-xl">
              {/* Compact Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-1.5 bg-indigo-500/30 rounded-lg flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-indigo-200" />
                  </div>
                  
                  {/* Horizontal Layout: Title + Question + Confidence */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <h3 className="text-base font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 flex-shrink-0">
                      Aetheria Response
                    </h3>
                    
                    <div className="text-sm text-white/60 flex-shrink-0">•</div>
                    
                    <CompactQuestionDisplay 
                      question={question}
                      maxLength={60}
                    />
                    
                    {response?.intent?.confidence && (
                      <>
                        <div className="text-sm text-white/60 flex-shrink-0">•</div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {getResponseTypeIcon()}
                          <span className="text-sm text-white/70">
                            {response?.type?.replace('_', ' ') || 'Response'}
                          </span>
                          <span className="text-sm text-white/60">
                            ({Math.round(response.intent.confidence * 100)}%)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-white/70">AI</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isContentReady && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(modalContent)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadResponse(modalContent)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              {(
                <div className="flex-1 flex flex-col overflow-hidden">
                  {isStreaming && !response ? (
                    <div className="p-6 h-full overflow-y-auto">
                      {/* Streaming State */}
                      <div className="flex items-center gap-3 mb-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-5 w-5 text-indigo-400" />
                        </motion.div>
                        <span className="text-sm text-white/70">
                          Aetheria is thinking...
                        </span>
                      </div>
                      
                      <div className="enhanced-response-area p-6 h-full">
                        <StreamingText
                          text={streamingContent}
                          isComplete={false}
                          speed={20}
                        />
                      </div>
                    </div>
                  ) : isContentReady ? (
                    <div className="p-6 flex-1 flex flex-col overflow-hidden">
                      {/* Tabbed Content */}
                      <Tabs 
                        value={activeTab || 'response'} 
                        onValueChange={(value) => onTabChange(value as ActiveTab)} 
                        className="flex-1 flex flex-col overflow-hidden"
                      >
                        <TabsList className="grid w-full grid-cols-2 bg-white/5">
                          <TabsTrigger value="response">Response</TabsTrigger>
                          <TabsTrigger value="code">Code & Context</TabsTrigger>
                        </TabsList>

                        <TabsContent value="response" className="flex-1 overflow-y-auto">
                          <div className="w-full max-w-full">
                            <div className="enhanced-response-area p-6 break-words overflow-wrap-anywhere">
                              <StreamingText
                                text={modalContent}
                                isComplete={true}
                              />
                            </div>
                            
                            {/* Metadata Display */}
                            {response?.metadata && (
                              <div className="space-y-3 p-6 pt-0">
                                {response.metadata.warnings && response.metadata.warnings.length > 0 && (
                                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-yellow-300 mb-2">
                                      <AlertCircle className="h-4 w-4" />
                                      <span className="font-medium">Warnings</span>
                                    </div>
                                    <ul className="text-sm text-yellow-200 space-y-1">
                                      {response.metadata.warnings.map((warning, index) => (
                                        <li key={index}>• {warning}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {response.metadata.suggestions && response.metadata.suggestions.length > 0 && (
                                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-blue-300 mb-2">
                                      <InfoIcon className="h-4 w-4" />
                                      <span className="font-medium">Suggestions</span>
                                    </div>
                                    <ul className="text-sm text-blue-200 space-y-1">
                                      {response.metadata.suggestions.map((suggestion, index) => (
                                        <li key={index}>• {suggestion.description}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="code" className="flex-1 overflow-y-auto">
                          <div className="p-6 w-full max-w-full">
                            {response && (
                              <CodeContextTab
                                response={response}
                                projectId={projectId}
                              />
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <div className="p-6 h-full flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Waiting for response...</p>
                        <p className="text-sm mt-2">Ask Aetheria a question to see the response here</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassmorphicCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};