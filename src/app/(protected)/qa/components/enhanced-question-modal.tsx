'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Download,
  MessageSquare,
  Sparkles,
  Code,
  FileText,
  CheckCircle,
  AlertCircle,
  InfoIcon,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import { DarkMarkdown } from '@/components/ui/dark-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CodeContextTab } from '@/components/ui/code-context-tab';
import type { Question } from '../types/question';
import type { EnhancedResponse } from '@/app/(protected)/dashboard/ask-question-card/types/enhanced-response';
import { getUserDisplayName, getUserImageUrl, getFileReferencesFromQuestion } from '../types/question';

interface EnhancedQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
}

type ActiveTab = 'response' | 'code-context';

export const EnhancedQuestionModal: React.FC<EnhancedQuestionModalProps> = ({
  isOpen,
  onClose,
  question
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('response');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResponse = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getResponseTypeIcon = () => {
    if (!question.intent) return <MessageSquare className="h-4 w-4" />;
    switch (question.intent) {
      case 'code_generation': return <Code className="h-4 w-4" />;
      case 'code_improvement': return <Code className="h-4 w-4" />;
      case 'code_review': return <CheckCircle className="h-4 w-4" />;
      case 'debug': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResponseTypeColor = () => {
    if (!question.intent) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    switch (question.intent) {
      case 'code_generation': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'code_improvement': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'code_review': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'debug': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  // Convert Question to EnhancedResponse format for CodeContextTab
  const convertQuestionToResponse = (): EnhancedResponse => {
    const fileReferences = getFileReferencesFromQuestion(question);
    const codeGeneration = question.analytics?.codeGenerations?.[0];
    
    return {
      type: 'answer',
      content: question.answer,
      intent: {
        type: (question.intent as 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain') || 'question',
        confidence: question.confidence || 0,
        requiresCodeGen: !!question.metadata?.generatedCode || !!codeGeneration?.generatedCode,
        requiresFileModification: false,
        contextNeeded: 'project'
      },
      metadata: {
        generatedCode: question.metadata?.generatedCode || codeGeneration?.generatedCode,
        language: question.metadata?.language || codeGeneration?.language || 'typescript',
        files: codeGeneration?.filename ? [codeGeneration.filename] : undefined
      },
      filesReferences: fileReferences.map(ref => ({
        fileName: ref.fileName,
        sourceCode: ref.sourceCode,
        summary: ref.summary || 'No summary available'
      }))
    };
  };

  const enhancedResponse = convertQuestionToResponse();

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
                  <div className="flex items-center">
                    <div className="mr-3">
                      <img 
                        src={getUserImageUrl(question.user)}
                        alt={getUserDisplayName(question.user)}
                        className="h-8 w-8 rounded-full ring-2 ring-indigo-400/30"
                      />
                    </div>
                    <div className="p-2 bg-indigo-500/30 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-indigo-200" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                      Saved Answer
                    </h3>
                    <p className="text-sm text-white/60 truncate max-w-md">
                      {question.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-white/70">AI-Powered</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-xs text-white/50 mr-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(question.createdAt).toLocaleDateString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(question.answer)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadResponse(question.answer)}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
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
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                  {/* Response Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getResponseTypeIcon()}
                        <Badge className={getResponseTypeColor()}>
                          {question.intent?.replace('_', ' ') || 'Question'}
                        </Badge>
                      </div>
                      {question.confidence && (
                        <div className="text-sm text-white/60">
                          Confidence: {Math.round(question.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabbed Content */}
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5">
                      <TabsTrigger value="response">Response</TabsTrigger>
                      <TabsTrigger value="code-context">Code & Context</TabsTrigger>
                    </TabsList>

                    <TabsContent value="response" className="flex-1 overflow-y-auto">
                      <div className="w-full max-w-full">
                        <div className="enhanced-response-area p-6 break-words overflow-wrap-anywhere">
                          <DarkMarkdown content={question.answer} />
                        </div>
                        
                        {/* Display tags if available */}
                        {question.metadata?.tags && question.metadata.tags.length > 0 && (
                          <div className="space-y-3 p-6 pt-0">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-blue-300 mb-2">
                                <InfoIcon className="h-4 w-4" />
                                <span className="font-medium">Tags</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {question.metadata.tags.map((tag, index) => (
                                  <span key={index} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="code-context" className="flex-1 overflow-y-auto">
                      <div className="p-6 w-full max-w-full">
                        <CodeContextTab
                          response={enhancedResponse}
                          projectId={question.projectId}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </GlassmorphicCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};