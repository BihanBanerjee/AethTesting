// src/components/ui/response-modal.tsx
'use client';

import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import { DiffViewer } from '@/components/code/diff-viewer/index';
import CodeReferences from '@/app/(protected)/dashboard/code-references';
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
    if (!response?.type) return <MessageSquare className="h-4 w-4" />;
    switch (response.type) {
      case 'code': return <Code className="h-4 w-4" />;
      case 'review': return <CheckCircle className="h-4 w-4" />;
      case 'debug': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResponseTypeColor = () => {
    if (!response?.type) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    switch (response.type) {
      case 'code': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'review': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'debug': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const modalContent = response?.content || streamingContent;
  const isContentReady = response !== null || streamingContent.length > 0;

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
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/30 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                      Aetheria Response
                    </h3>
                    <p className="text-sm text-white/60 truncate max-w-md">
                      {question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-white/70">AI-Powered</span>
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
                      {/* Response Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getResponseTypeIcon()}
                            <Badge className={getResponseTypeColor()}>
                              {response?.type?.replace('_', ' ') || 'Response'}
                            </Badge>
                          </div>
                          <div className="text-sm text-white/60">
                            Confidence: {Math.round((response?.intent?.confidence || 0) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Tabbed Content */}
                      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ActiveTab)} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-3 bg-white/5">
                          <TabsTrigger value="response">Response</TabsTrigger>
                          <TabsTrigger value="code">Code</TabsTrigger>
                          <TabsTrigger value="files">Files</TabsTrigger>
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
                          <div className="p-6 space-y-4 w-full max-w-full">
                            {response?.metadata?.generatedCode && (
                              <CodeBlock
                                code={response.metadata.generatedCode}
                                language={response.metadata.language || 'typescript'}
                                filename={response.metadata.files?.[0] || 'generated-code'}
                              />
                            )}
                            
                            {response?.metadata?.diff && typeof response.metadata.diff === 'object' && (
                              <DiffViewer
                                original={(response.metadata.diff as any).original || ''}
                                modified={(response.metadata.diff as any).modified || ''}
                                filename={response.metadata.files?.[0] || 'modified-code'}
                              />
                            )}
                            
                            {(!response?.metadata?.generatedCode && !response?.metadata?.diff) && (
                              <div className="text-center py-12 text-white/60">
                                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No code generated</p>
                                <p className="text-sm mt-2">This response doesn't include any code snippets</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="files" className="flex-1 overflow-y-auto">
                          <div className="p-6 w-full max-w-full">
                            {response?.filesReferences && response.filesReferences.length > 0 ? (
                              <CodeReferences
                                filesReferences={response.filesReferences}
                                className=""
                              />
                            ) : (
                              <div className="text-center py-12 text-white/60">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">No files referenced</p>
                                <p className="text-sm mt-2">This response doesn't include any specific file references</p>
                              </div>
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