// src/app/(protected)/code-assistant/page.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Send, 
  FileText, 
  GitBranch, 
  Lightbulb, 
  Zap,
  Copy,
  Download,
  Play,
  RefreshCw,
  MessageSquare,
  Settings
} from 'lucide-react';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import { CodeBlock } from '@/components/code/enhanced-code-block';
import { DiffViewer } from '@/components/code/diff-viewer';
import { FileExplorer } from '@/components/code/file-explorer';
import { IntentClassifier } from '@/lib/intent-classifier';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  intent?: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'debugging';
  metadata?: {
    files?: string[];
    generatedCode?: string;
    language?: string;
    diff?: {
      original: string;
      modified: string;
      filename: string;
    };
    suggestions?: Array<{
      type: 'improvement' | 'bug_fix' | 'optimization';
      description: string;
      code?: string;
    }>;
  };
  timestamp: Date;
}

const CodeAssistantPage = () => {
  const [classifier] = useState(() => new IntentClassifier());
  const { project } = useProject();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'history'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const askCodeQuestion = api.codeAssistant.askQuestion.useMutation();
  const generateCode = api.codeAssistant.generateCode.useMutation();
  const improveCode = api.codeAssistant.improveCode.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectIntent = async (message: string) => {
    try {
      const projectContext = {
        availableFiles: selectedFiles,
        techStack: project?.techStack || [],
        recentFiles: project?.recentFiles || []
      };
      
      const intent = await classifier.classifyQuery(message, projectContext);
      
      // Extract file references
      const fileReferences = classifier.extractFileReferences(message, availableFiles);
      
      return {
        ...intent,
        targetFiles: fileReferences
      };
    } catch (error) {
      console.error('Intent classification failed:', error);
      // Fallback to existing pattern matching
      return fallbackDetectIntent(message);
    }
  };

    const handleSendMessage = async () => {
    if (!input.trim() || !project) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Use AI-powered intent classification
    const intent = await detectIntent(input);

    try {
      let response;
      
      switch (intent.type) {
        case 'code_generation':
          response = await generateCode.mutateAsync({
            projectId: project.id,
            prompt: input,
            context: intent.targetFiles || selectedFiles,
            requirements: extractRequirements(input, intent)
          });
          break;
          
        case 'code_improvement':
          response = await improveCode.mutateAsync({
            projectId: project.id,
            code: extractCodeFromContext(),
            improvementType: 'optimization',
            suggestions: input,
            targetFiles: intent.targetFiles
          });
          break;
          
        case 'code_review':
          response = await reviewCode.mutateAsync({
            projectId: project.id,
            files: intent.targetFiles || selectedFiles,
            reviewType: 'comprehensive',
            focusAreas: intent.contextNeeded
          });
          break;
          
        case 'debug':
          response = await debugCode.mutateAsync({
            projectId: project.id,
            errorDescription: input,
            suspectedFiles: intent.targetFiles,
            contextLevel: intent.contextNeeded
          });
          break;
          
        default:
          response = await askCodeQuestion.mutateAsync({
            projectId: project.id,
            question: input,
            context: intent.targetFiles || selectedFiles,
            intent: intent.type
          });
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: response.answer || response.explanation || '',
        intent: intent.type,
        confidence: intent.confidence,
        metadata: {
          files: response.filesReferences?.map(f => f.fileName) || intent.targetFiles || [],
          generatedCode: response.generatedCode,
          language: response.language,
          diff: response.diff,
          suggestions: response.suggestions,
          requiresCodeGen: intent.requiresCodeGen,
          requiresFileModification: intent.requiresFileModification
        },
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error processing request:', error);
      // Handle error...
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };
};

  const extractRequirements = (prompt: string) => {
    // Extract technical requirements from the prompt
    const requirements = {
      framework: detectFramework(prompt),
      language: detectLanguage(prompt),
      features: extractFeatures(prompt),
      constraints: extractConstraints(prompt)
    };
    return requirements;
  };

  const extractCodeFromContext = () => {
    // Extract code from selected files or previous messages
    return '';
  };

  const detectFramework = (text: string) => {
    const frameworks = ['react', 'next.js', 'vue', 'angular', 'svelte'];
    return frameworks.find(fw => text.toLowerCase().includes(fw)) || 'react';
  };

  const detectLanguage = (text: string) => {
    const languages = ['typescript', 'javascript', 'python', 'rust', 'go'];
    return languages.find(lang => text.toLowerCase().includes(lang)) || 'typescript';
  };

  const extractFeatures = (text: string) => {
    const features = [];
    if (text.includes('authentication')) features.push('auth');
    if (text.includes('database')) features.push('database');
    if (text.includes('api')) features.push('api');
    return features;
  };

  const extractConstraints = (text: string) => {
    const constraints = [];
    if (text.includes('responsive')) constraints.push('responsive');
    if (text.includes('accessible')) constraints.push('a11y');
    if (text.includes('performance')) constraints.push('performance');
    return constraints;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const QuickActions = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput('Generate a React component for user authentication')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <Code className="h-4 w-4 mr-1" />
        Generate Component
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput('Review and improve the code quality in this file')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <Lightbulb className="h-4 w-4 mr-1" />
        Code Review
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput('Optimize this function for better performance')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <Zap className="h-4 w-4 mr-1" />
        Optimize
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput('Debug this error and suggest a fix')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Debug
      </Button>
    </div>
  );

  const MessageComponent = ({ message }: { message: Message }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-4xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
        <GlassmorphicCard className={`p-4 ${
          message.type === 'user' 
            ? 'bg-indigo-600/20 border-indigo-500/30' 
            : 'bg-white/10 border-white/20'
        }`}>
          {message.intent && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {message.intent.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-white/60">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <div className="prose prose-invert max-w-none">
            {message.content}
          </div>

          {/* Code Generation Result */}
          {message.metadata?.generatedCode && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-white">Generated Code</h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(message.metadata.generatedCode!)}
                    className="border-white/20 bg-white/10 text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCode(message.metadata.generatedCode!, 'generated-code.ts')}
                    className="border-white/20 bg-white/10 text-white"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CodeBlock
                code={message.metadata.generatedCode}
                language={message.metadata.language || 'typescript'}
              />
            </div>
          )}

          {/* Diff Display */}
          {message.metadata?.diff && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2">Suggested Changes</h4>
              <DiffViewer
                original={message.metadata.diff.original}
                modified={message.metadata.diff.modified}
                filename={message.metadata.diff.filename}
              />
            </div>
          )}

          {/* Code Suggestions */}
          {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2">Suggestions</h4>
              <div className="space-y-2">
                {message.metadata.suggestions.map((suggestion, index) => (
                  <GlassmorphicCard key={index} className="p-3 bg-white/5">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          suggestion.type === 'improvement' ? 'border-green-500/30 text-green-300' :
                          suggestion.type === 'bug_fix' ? 'border-red-500/30 text-red-300' :
                          'border-blue-500/30 text-blue-300'
                        }`}
                      >
                        {suggestion.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/80 mt-1">{suggestion.description}</p>
                    {suggestion.code && (
                      <CodeBlock
                        code={suggestion.code}
                        language="typescript"
                        className="mt-2"
                      />
                    )}
                  </GlassmorphicCard>
                ))}
              </div>
            </div>
          )}

          {/* File References */}
          {message.metadata?.files && message.metadata.files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2">Referenced Files</h4>
              <div className="flex flex-wrap gap-1">
                {message.metadata.files.map((file, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {file.split('/').pop()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </GlassmorphicCard>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
            Code Assistant
          </h1>
          <p className="text-white/70">AI-powered coding companion for {project?.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/30 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            Connected
          </Badge>
          <Button variant="outline" size="sm" className="border-white/20 bg-white/10">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-white/10">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files ({selectedFiles.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Code className="h-12 w-12 mx-auto mb-4 text-white/40" />
                  <h3 className="text-lg font-medium text-white/80 mb-2">
                    Ready to assist with your code
                  </h3>
                  <p className="text-white/60 mb-6">
                    Ask me to generate code, review existing code, or help debug issues
                  </p>
                  <QuickActions />
                </motion.div>
              )}
              
              {messages.map((message) => (
                <MessageComponent key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start mb-4"
                >
                  <GlassmorphicCard className="p-4 bg-white/10">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      </div>
                      <span className="text-white/60">AI is thinking...</span>
                    </div>
                  </GlassmorphicCard>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-white/60" />
                <span className="text-sm text-white/60">Context Files:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedFiles.map((file, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-white/20 bg-white/10 cursor-pointer"
                    onClick={() => setSelectedFiles(prev => prev.filter(f => f !== file))}
                  >
                    {file.split('/').pop()}
                    <span className="ml-1 text-white/40">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me to generate code, review files, or help with debugging... (Ctrl+Enter to send)"
              className="min-h-[100px] pr-12 bg-white/10 border-white/20 text-white resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="files" className="flex-1 mt-4">
          <FileExplorer
            projectId={project?.id || ''}
            selectedFiles={selectedFiles}
            onFileSelect={(files) => setSelectedFiles(files)}
          />
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-4">
          <GlassmorphicCard className="p-6 text-center">
            <GitBranch className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <h3 className="text-lg font-medium text-white/80 mb-2">
              Conversation History
            </h3>
            <p className="text-white/60">
              Previous conversations and generated code will appear here
            </p>
          </GlassmorphicCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodeAssistantPage;