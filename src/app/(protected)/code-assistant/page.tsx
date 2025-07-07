// src/app/(protected)/code-assistant/page.tsx - Integrated Version
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
  Settings,
  Bug,
  Search,
  Sparkles,
  Wrench,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import useProject from '@/hooks/use-project';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';

// Import the isolated components
import { CodeGenerationPanel } from '@/components/code/code-generation-panel';
import { ContextAwareFileSelector } from '@/components/code-assistant/context-aware-file-selector';
import { IntentClassifierProvider, useIntentClassifier } from '@/components/code-assistant/intent-classifier-wrapper';
import { IntentProgressTracker } from '@/components/code-assistant/intent-progress-tracker';
import { SmartInputSuggestions } from '@/components/code-assistant/smart-input-suggestion';
import { CodeBlock } from '@/components/code/enhanced-code-block';
import { DiffViewer } from '@/components/code/diff-viewer';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  intent?: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
  confidence?: number;
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
      type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
      description: string;
      code?: string;
    }>;
    requiresCodeGen?: boolean;
    requiresFileModification?: boolean;
    targetFiles?: string[];
  };
  timestamp: Date;
}

// Main component wrapped with providers
const CodeAssistantPageContent = () => {
  const { project } = useProject();
  const { classifyQuery, isReady } = useIntentClassifier();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'generation' | 'files'>('chat');
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  
  // Processing states
  const [currentIntent, setCurrentIntent] = useState<string>('');
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'processing' | 'generating' | 'complete' | 'error'>('complete');
  const [progress, setProgress] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced API calls for different intents
  const askQuestion = api.project.askQuestionWithIntent.useMutation();
  const generateCode = api.project.generateCode.useMutation();
  const improveCode = api.project.improveCode.useMutation();
  const reviewCode = api.project.reviewCode.useMutation();
  const debugCode = api.project.debugCode.useMutation();
  const explainCode = api.project.explainCode.useMutation();

  // Get available files
  const { data: projectFiles } = api.project.getProjectFiles?.useQuery(
    { projectId: project?.id || '' },
    { 
      enabled: !!project?.id,
      onSuccess: (data) => {
        setAvailableFiles(data?.map(f => f.fileName) || []);
      }
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !project) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Step 1: Classify intent
      setProcessingStage('analyzing');
      setProgress(10);
      
      const intent = await classifyQuery(input, { 
        availableFiles,
        selectedFiles 
      });
      
      setCurrentIntent(intent.type);
      setProgress(30);

      let response;
      setProcessingStage('processing');
      setProgress(50);

      // Step 2: Route to appropriate handler based on intent
      switch (intent.type) {
        case 'code_generation':
          setProcessingStage('generating');
          setProgress(70);
          
          response = await generateCode.mutateAsync({
            projectId: project.id,
            prompt: input,
            context: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            requirements: {
              framework: 'react',
              language: 'typescript',
              features: extractFeatures(input),
              constraints: extractConstraints(input)
            }
          });
          break;
          
        case 'code_improvement':
          response = await improveCode.mutateAsync({
            projectId: project.id,
            suggestions: input,
            targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            improvementType: detectImprovementType(input)
          });
          break;
          
        case 'code_review':
          response = await reviewCode.mutateAsync({
            projectId: project.id,
            files: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [],
            reviewType: detectReviewType(input),
            focusAreas: input
          });
          break;
          
        case 'debug':
          response = await debugCode.mutateAsync({
            projectId: project.id,
            errorDescription: input,
            suspectedFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            contextLevel: intent.contextNeeded || 'project'
          });
          break;
          
        case 'explain':
          response = await explainCode.mutateAsync({
            projectId: project.id,
            query: input,
            targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            detailLevel: detectDetailLevel(input)
          });
          break;
          
        default:
          // Fallback to general Q&A
          response = await askQuestion.mutateAsync({
            projectId: project.id,
            query: input,
            contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            intent: intent.type
          });
      }

      setProgress(90);
      setProcessingStage('complete');
      setProgress(100);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer || response.explanation || response.response || response.summary || '',
        intent: intent.type,
        confidence: intent.confidence,
        metadata: {
          files: response.filesReferences?.map((f: any) => f.fileName) || intent.targetFiles || [],
          generatedCode: response.generatedCode || response.improvedCode || response.refactoredCode,
          language: response.language,
          diff: response.diff,
          suggestions: response.suggestions || response.improvements || response.issues,
          requiresCodeGen: intent.requiresCodeGen,
          requiresFileModification: intent.requiresFileModification,
          targetFiles: intent.targetFiles
        },
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setActiveTab('chat');
      
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process your request. Please try again.');
      
      setProcessingStage('error');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I encountered an error processing your request. Please try rephrasing your question or check if the project is properly loaded.',
        intent: currentIntent as any,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput('');
      setTimeout(() => {
        setProcessingStage('complete');
        setProgress(0);
      }, 2000);
    }
  };

  // Helper functions for intent detection
  const extractFeatures = (text: string) => {
    const features = [];
    if (text.toLowerCase().includes('authentication') || text.toLowerCase().includes('auth')) features.push('auth');
    if (text.toLowerCase().includes('database') || text.toLowerCase().includes('db')) features.push('database');
    if (text.toLowerCase().includes('api')) features.push('api');
    if (text.toLowerCase().includes('form')) features.push('forms');
    if (text.toLowerCase().includes('validation')) features.push('validation');
    if (text.toLowerCase().includes('responsive')) features.push('responsive');
    return features;
  };

  const extractConstraints = (text: string) => {
    const constraints = [];
    if (text.toLowerCase().includes('responsive')) constraints.push('responsive');
    if (text.toLowerCase().includes('accessible') || text.toLowerCase().includes('a11y')) constraints.push('a11y');
    if (text.toLowerCase().includes('performance')) constraints.push('performance');
    if (text.toLowerCase().includes('mobile')) constraints.push('mobile-first');
    if (text.toLowerCase().includes('seo')) constraints.push('seo');
    return constraints;
  };

  const detectImprovementType = (text: string): 'performance' | 'readability' | 'security' | 'optimization' => {
    if (text.toLowerCase().includes('performance') || text.toLowerCase().includes('faster') || text.toLowerCase().includes('optimize')) return 'performance';
    if (text.toLowerCase().includes('security') || text.toLowerCase().includes('secure')) return 'security';
    if (text.toLowerCase().includes('readable') || text.toLowerCase().includes('clean') || text.toLowerCase().includes('maintainable')) return 'readability';
    return 'optimization';
  };

  const detectReviewType = (text: string): 'security' | 'performance' | 'comprehensive' => {
    if (text.toLowerCase().includes('security')) return 'security';
    if (text.toLowerCase().includes('performance')) return 'performance';
    return 'comprehensive';
  };

  const detectDetailLevel = (text: string): 'brief' | 'detailed' | 'comprehensive' => {
    if (text.toLowerCase().includes('brief') || text.toLowerCase().includes('quick')) return 'brief';
    if (text.toLowerCase().includes('detailed') || text.toLowerCase().includes('deep') || text.toLowerCase().includes('comprehensive')) return 'comprehensive';
    return 'detailed';
  };

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'code_generation': return <Code className="h-4 w-4" />;
      case 'code_improvement': return <Zap className="h-4 w-4" />;
      case 'code_review': return <Search className="h-4 w-4" />;
      case 'debug': return <Bug className="h-4 w-4" />;
      case 'refactor': return <Wrench className="h-4 w-4" />;
      case 'explain': return <Lightbulb className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'code_generation': return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'code_improvement': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'code_review': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
      case 'debug': return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'refactor': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'explain': return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
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
              <Badge className={`text-xs ${getIntentColor(message.intent)}`}>
                {getIntentIcon(message.intent)}
                <span className="ml-1">{message.intent.replace('_', ' ')}</span>
              </Badge>
              {message.confidence && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(message.confidence * 100)}% confidence
                </Badge>
              )}
              <span className="text-xs text-white/60">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <div className="prose prose-invert max-w-none">
            {message.content}
          </div>

          {/* Enhanced Code Generation Result */}
          {message.metadata?.generatedCode && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-white flex items-center">
                  {getIntentIcon(message.intent)}
                  <span className="ml-1">Generated Code</span>
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(message.metadata!.generatedCode!)}
                    className="border-white/20 bg-white/10 text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCode(message.metadata!.generatedCode!, `generated-${message.intent}.${message.metadata!.language === 'typescript' ? 'ts' : 'js'}`)}
                    className="border-white/20 bg-white/10 text-white"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CodeBlock
                code={message.metadata.generatedCode}
                language={message.metadata.language || 'typescript'}
                actions={{
                  copy: true,
                  download: true
                }}
              />
            </div>
          )}

          {/* Enhanced Diff Display */}
          {message.metadata?.diff && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                <RefreshCw className="h-4 w-4 mr-1" />
                Suggested Changes
              </h4>
              <DiffViewer
                original={message.metadata.diff.original}
                modified={message.metadata.diff.modified}
                filename={message.metadata.diff.filename}
              />
            </div>
          )}

          {/* Enhanced Suggestions */}
          {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-1" />
                AI Suggestions
              </h4>
              <div className="space-y-2">
                {message.metadata.suggestions.map((suggestion, index) => (
                  <GlassmorphicCard key={index} className="p-3 bg-white/5">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          suggestion.type === 'improvement' ? 'border-green-500/30 text-green-300' :
                          suggestion.type === 'bug_fix' ? 'border-red-500/30 text-red-300' :
                          suggestion.type === 'security' ? 'border-orange-500/30 text-orange-300' :
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
                        actions={{ copy: true }}
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

  const projectContext = {
    availableFiles,
    techStack: ['React', 'TypeScript', 'Next.js'], // This could come from project analysis
    recentQueries: [] // Could store recent queries
  };

  return (
    <div className="h-full flex flex-col text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
            AI Code Assistant
          </h1>
          <p className="text-white/70">
            Intelligent coding companion with intent classification for {project?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/30 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            AI Ready
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
            Smart Chat
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code Generation
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Files ({selectedFiles.length})
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
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Code className="h-12 w-12 text-white/40" />
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Sparkles className="h-2 w-2 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-white/80 mb-2">
                    AI-Powered Code Assistant Ready
                  </h3>
                  <p className="text-white/60 mb-6">
                    Ask me to generate, review, debug, explain, or improve your code. I understand your intent automatically!
                  </p>
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
                    <div className="space-y-3">
                      <IntentProgressTracker
                        intent={currentIntent}
                        confidence={0.8}
                        stage={processingStage}
                        progress={progress}
                        currentStep={
                          processingStage === 'analyzing' ? 'Analyzing your request...' :
                          processingStage === 'processing' ? 'Processing with AI...' :
                          processingStage === 'generating' ? 'Generating response...' :
                          'Complete'
                        }
                      />
                    </div>
                  </GlassmorphicCard>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Smart Input Suggestions */}
          <SmartInputSuggestions
            currentInput={input}
            onSuggestionSelect={(suggestion) => setInput(suggestion)}
            projectContext={projectContext}
          />

          {/* Context-Aware File Selector */}
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

          {/* Enhanced Input Area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe what you want to do with your code... (I'll understand your intent automatically!)"
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

        <TabsContent value="generation" className="flex-1 mt-4">
          <CodeGenerationPanel
            projectId={project?.id || ''}
            availableFiles={availableFiles}
            onGenerate={async (request) => {
              // Mock implementation - you would integrate with your actual API
              const result = await generateCode.mutateAsync({
                projectId: project!.id,
                prompt: request.prompt,
                requirements: {
                  framework: request.framework,
                  language: request.language
                }
              });

              return {
                id: Date.now().toString(),
                type: request.type,
                generatedCode: result.generatedCode || '',
                explanation: result.explanation || '',
                filename: `generated-${request.type}.${request.language === 'typescript' ? 'ts' : 'js'}`,
                language: result.language || 'typescript',
                confidence: 85,
                suggestions: []
              };
            }}
            onApplyChanges={async (result) => {
              // Mock implementation for applying changes
              toast.success(`Applied changes for ${result.filename}`);
            }}
          />
        </TabsContent>

        <TabsContent value="files" className="flex-1 mt-4">
          <ContextAwareFileSelector
            availableFiles={availableFiles}
            selectedFiles={selectedFiles}
            onFileSelectionChange={setSelectedFiles}
            currentQuery={input}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main exported component with providers
const CodeAssistantPage = () => {
  return (
    <IntentClassifierProvider>
      <CodeAssistantPageContent />
    </IntentClassifierProvider>
  );
};

export default CodeAssistantPage;