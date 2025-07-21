// src/components/ui/response-modal.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minimize2,
  Maximize2,
  Copy,
  Download,
  MessageSquare,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import { DarkMarkdown } from '@/components/ui/dark-markdown';
import type { EnhancedResponse } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: EnhancedResponse | null;
  question: string;
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
  isStreaming = false,
  streamingContent = ''
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);

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

  const modalContent = response?.content || streamingContent;
  const isContentReady = response !== null || streamingContent.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: isMaximized ? 1 : 0.95, 
              opacity: 1,
              width: isMaximized ? '95vw' : '90vw',
              height: isMaximized ? '95vh' : isMinimized ? '120px' : '80vh'
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative max-w-6xl w-full"
          >
            <GlassmorphicCard className="h-full flex flex-col overflow-hidden border-2 border-white/20 shadow-2xl">
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
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
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
              {!isMinimized && (
                <div className="flex-1 overflow-hidden">
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
                    <div className="p-6 h-full overflow-y-auto">
                      {/* Response Complete State */}
                      <div className="enhanced-response-area p-6 h-full">
                        <StreamingText
                          text={modalContent}
                          isComplete={true}
                        />
                      </div>
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