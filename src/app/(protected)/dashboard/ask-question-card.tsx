// src/app/(protected)/dashboard/ask-question-card.tsx - FIXED SCROLLING VERSION
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
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import MDEditor from '@uiw/react-md-editor';
import CodeReferences from './code-references';
import { EnhancedSaveButton } from '@/components/feedback/enhanced-save-button';
import useRefetch from '@/hooks/use-refetch';
import Image from 'next/image';

interface EnhancedResponse {
  type: 'answer' | 'code' | 'review' | 'debug' | 'explanation';
  content: string;
  intent: {
    type: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
    confidence: number;
    requiresCodeGen: boolean;
    requiresFileModification: boolean;
    contextNeeded: 'file' | 'function' | 'project' | 'global';
    targetFiles?: string[];
  };
  metadata?: {
    generatedCode?: string;
    language?: string;
    diff?: string;
    suggestions?: Array<{
      type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
      description: string;
      code?: string;
    }>;
    issues?: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      suggestion: string;
    }>;
    files?: string[];
    warnings?: string[];
    dependencies?: string[];
  };
  filesReferences?: {fileName: string; sourceCode: string; summary: string}[];
  timestamp?: Date;
}

const EnhancedAskQuestionCardContent = () => {
  const { project } = useProject();
  const { classifyQuery, isReady } = useIntentClassifier();
  
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<EnhancedResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'response' | 'code' | 'files'>('response');
  const [intentPreview, setIntentPreview] = useState<any>(null);
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'processing' | 'generating' | 'complete'>('analyzing');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();

  // Enhanced API mutations for different intents
  const askQuestion = api.project.askQuestionWithIntent.useMutation();
  const generateCode = api.project.generateCode.useMutation();
  const improveCode = api.project.improveCode.useMutation();
  const reviewCode = api.project.reviewCode.useMutation();
  const debugCode = api.project.debugCode.useMutation();
  const explainCode = api.project.explainCode.useMutation();

  // Get available files for context selection
  const { data: projectFiles } = api.project.getProjectFiles?.useQuery(
    { projectId: project?.id || '' },
    { 
      enabled: !!project?.id,
      onSuccess: (data) => {
        setAvailableFiles(data?.map(f => f.fileName) || []);
      }
    }
  );

  // Intent classification preview
  useEffect(() => {
    if (question.length > 10 && isReady) {
      const timer = setTimeout(async () => {
        try {
          setProcessingStage('analyzing');
          const intent = await classifyQuery(question, { 
            availableFiles,
            selectedFiles 
          });
          setIntentPreview(intent);
        } catch (error) {
          console.error('Intent preview failed:', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setIntentPreview(null);
    }
  }, [question, classifyQuery, isReady, availableFiles, selectedFiles]);

  const getIntentIcon = (type: string) => {
    switch (type) {
      case 'code_generation': return <Code className="h-4 w-4" />;
      case 'code_improvement': return <Zap className="h-4 w-4" />;
      case 'code_review': return <Search className="h-4 w-4" />;
      case 'debug': return <Bug className="h-4 w-4" />;
      case 'refactor': return <Wrench className="h-4 w-4" />;
      case 'explain': return <Lightbulb className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getIntentColor = (type: string) => {
    switch (type) {
      case 'code_generation': return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'code_improvement': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'code_review': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
      case 'debug': return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'refactor': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'explain': return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  // Simple helper function for other response types
  const extractSimpleContent = (result: any): string => {
    if (typeof result === 'string') return result;
    if (result.explanation) return String(result.explanation);
    if (result.summary) return String(result.summary);
    if (result.diagnosis) return String(result.diagnosis);
    if (result.answer) return String(result.answer);
    if (result.response) return String(result.response);
    return JSON.stringify(result, null, 2);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project?.id || !question.trim()) return;

    setResponse(null);
    setLoading(true);
    setProcessingStage('analyzing');
    
    try {
      // First classify the intent
      setProcessingStage('processing');
      const intent = await classifyQuery(question, {
        availableFiles,
        selectedFiles
      });

      let result: any;
      setProcessingStage('generating');

      console.log('🎯 Processing intent:', intent.type);

      // Route to appropriate handler based on intent
      switch (intent.type) {
        case 'code_generation':
          result = await generateCode.mutateAsync({
            projectId: project.id,
            prompt: question,
            context: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            requirements: {
              framework: 'react',
              language: 'typescript'
            }
          });

          setResponse({
            type: 'code',
            content: extractSimpleContent(result),
            intent,
            metadata: {
              generatedCode: result.generatedCode,
              language: result.language,
              warnings: result.warnings,
              dependencies: result.dependencies,
              files: result.files?.map((f: any) => f.path) || []
            },
            filesReferences: result.generatedCode ? [{
              fileName: result.files?.[0]?.path || `generated-${intent.type}.${result.language === 'typescript' ? 'ts' : 'js'}`,
              sourceCode: result.generatedCode,
              summary: `Generated ${intent.type} code`
            }] : []
          });
          break;

        case 'code_improvement':
          result = await improveCode.mutateAsync({
            projectId: project.id,
            suggestions: question,
            targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            improvementType: 'optimization'
          });

          setResponse({
            type: 'code',
            content: extractSimpleContent(result),
            intent,
            metadata: {
              generatedCode: result.improvedCode,
              diff: result.diff,
              suggestions: result.suggestions
            },
            filesReferences: result.improvedCode ? [{
              fileName: `improved-${intent.targetFiles?.[0] || 'code'}.${result.language || 'ts'}`,
              sourceCode: result.improvedCode,
              summary: `Improved code with ${intent.type}`
            }] : []
          });
          break;

        case 'code_review':
          result = await reviewCode.mutateAsync({
            projectId: project.id,
            files: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [],
            reviewType: 'comprehensive',
            focusAreas: question
          });

          setResponse({
            type: 'review',
            content: extractSimpleContent(result),
            intent,
            metadata: {
              issues: result.issues,
              suggestions: result.suggestions,
              files: result.filesReviewed
            }
          });
          break;

        case 'debug':
          result = await debugCode.mutateAsync({
            projectId: project.id,
            errorDescription: question,
            suspectedFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            contextLevel: intent.contextNeeded
          });

          setResponse({
            type: 'debug',
            content: extractSimpleContent(result),
            intent,
            metadata: {
              suggestions: result.solutions?.map((s: any) => ({
                type: 'bug_fix',
                description: s.description,
                code: s.code
              })) || []
            }
          });
          break;

        case 'explain':
          result = await explainCode.mutateAsync({
            projectId: project.id,
            query: question,
            targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
            detailLevel: 'detailed'
          });

          setResponse({
            type: 'explanation',
            content: extractSimpleContent(result),
            intent,
            metadata: {
              files: result.filesAnalyzed
            }
          });
          break;

      // Replace your entire default case with this:

        default:
          console.log('🔄 Using fallback askQuestion');
          const qaResult = await askQuestion.mutateAsync({
            projectId: project.id,
            query: question,
            contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles
          });

          console.log('📝 QA Result:', qaResult);

          let content = '';
          
          // Enhanced StreamableValue handling
          if (qaResult.answer) {
            if (typeof qaResult.answer === 'string') {
              content = qaResult.answer;
            } else if (typeof qaResult.answer === 'object') {
              try {
                console.log('🔄 Processing StreamableValue:', qaResult.answer);
                
                // Handle StreamableValue properly
                await new Promise<void>((resolve, reject) => {
                  let accumulated = '';
                  let attempts = 0;
                  const maxAttempts = 100; // Max 10 seconds (100 * 100ms)
                  
                  const readStream = () => {
                    attempts++;
                    
                    // Check if stream is done
                    if (qaResult.answer && typeof qaResult.answer === 'object') {
                      // Try to access the current value
                      const currentValue = qaResult.answer.value;
                      
                      if (currentValue !== undefined) {
                        if (typeof currentValue === 'string') {
                          accumulated = currentValue;
                        } else if (typeof currentValue === 'object') {
                          // Handle different StreamableValue states
                          if (currentValue.curr !== undefined) {
                            accumulated += String(currentValue.curr);
                          }
                          if (currentValue.next !== undefined && currentValue.next !== null) {
                            accumulated += String(currentValue.next);
                          }
                          
                          // If we have some content, use it
                          if (accumulated.length > 0) {
                            content = accumulated;
                            resolve();
                            return;
                          }
                        }
                      }
                    }
                    
                    // If we have some accumulated content, use it
                    if (accumulated.length > 0) {
                      content = accumulated;
                      resolve();
                      return;
                    }
                    
                    // Continue waiting if we haven't reached max attempts
                    if (attempts < maxAttempts) {
                      setTimeout(readStream, 100);
                    } else {
                      // Timeout - use whatever we have or fallback
                      content = accumulated || 'Response processing timed out';
                      resolve();
                    }
                  };
                  
                  readStream();
                });
                
                console.log('✅ Stream processed, content length:', content.length);
                
              } catch (error) {
                console.error('Error processing StreamableValue:', error);
                content = 'Error processing AI response';
              }
            } else {
              content = String(qaResult.answer);
            }
          } else {
            content = 'No response available';
          }

          console.log('✅ Final content:', content);

          setResponse({
            type: 'answer',
            content: typeof content === 'string' ? content : JSON.stringify(content),
            intent,
            filesReferences: qaResult.filesReferences || []
          });
          break;


      }

      setProcessingStage('complete');
      setActiveTab('response');
      
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process your request. Please try again.');
      
      setResponse({
        type: 'answer',
        content: 'I encountered an error processing your request. Please try rephrasing your question or check if the project is properly loaded.',
        intent: intentPreview || {
          type: 'question',
          confidence: 0,
          requiresCodeGen: false,
          requiresFileModification: false,
          contextNeeded: 'project'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string = 'content') => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  };

  const SmartSuggestions = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setQuestion('Generate a TypeScript React component for user authentication with form validation')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <Code className="h-4 w-4 mr-1" />
        Generate Component
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setQuestion('Review this code for security vulnerabilities and performance issues')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <Search className="h-4 w-4 mr-1" />
        Review Code
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setQuestion('Optimize this function for better performance and memory usage')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <Zap className="h-4 w-4 mr-1" />
        Optimize
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setQuestion('Debug this error: Cannot read property of undefined')}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
      >
        <Bug className="h-4 w-4 mr-1" />
        Debug Issue
      </Button>
    </div>
  );

  const projectContext = {
    availableFiles,
    techStack: ['React', 'TypeScript', 'Next.js'],
    recentQueries: []
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[90vw] max-h-[90vh] glassmorphism border border-white/20 flex flex-col'>
          <DialogHeader className="pr-10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="flex items-center">
                <Image src="/aetheria-logo.svg" alt="aetheria" width={40} height={40} className="filter drop-shadow-lg" />
                <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  AI Response
                </span>
              </DialogTitle>
              
              {response && (
                <div className="flex items-center gap-2 ml-auto">
                  <Badge className={`text-xs ${getIntentColor(response.intent.type)}`}>
                    {getIntentIcon(response.intent.type)}
                    <span className="ml-1">{response.intent.type.replace('_', ' ')}</span>
                  </Badge>
                  
                  <EnhancedSaveButton 
                    response={response}
                    project={project ?? null}
                    question={question}
                    selectedFiles={selectedFiles}
                    saveAnswer={saveAnswer}
                    refetch={refetch}
                  />
                </div>
              )}
            </div>
          </DialogHeader>

          {/* FIXED: Main content area with proper flex layout */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {loading && (
              <div className="flex-shrink-0 p-4">
                <IntentProgressTracker
                  intent={intentPreview?.type || 'question'}
                  confidence={intentPreview?.confidence || 0.8}
                  stage={processingStage}
                  progress={
                    processingStage === 'analyzing' ? 25 :
                    processingStage === 'processing' ? 50 :
                    processingStage === 'generating' ? 75 :
                    100
                  }
                  currentStep={
                    processingStage === 'analyzing' ? 'Analyzing your request...' :
                    processingStage === 'processing' ? 'Processing with AI...' :
                    processingStage === 'generating' ? 'Generating response...' :
                    'Complete'
                  }
                />
              </div>
            )}
            
            {response && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3 bg-white/10 flex-shrink-0 mx-4">
                  <TabsTrigger value="response" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Response
                  </TabsTrigger>
                  {response.metadata?.generatedCode && (
                    <TabsTrigger value="code" className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Generated Code
                    </TabsTrigger>
                  )}
                  {response.filesReferences && response.filesReferences.length > 0 && (
                    <TabsTrigger value="files" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Files ({response.filesReferences.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* FIXED: Content area with proper scrolling */}
                <div className="flex-1 overflow-hidden px-4 pb-4">
                  <TabsContent value="response" className="h-full mt-4 overflow-hidden">
                    <div className="h-full overflow-y-auto space-y-4 pr-2">
                      <div className="max-h-none">
                        <MDEditor.Markdown 
                          source={response.content || 'No response content available'} 
                          className='w-full custom-markdown' 
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                            color: 'white',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                          }}
                        />
                      </div>

                      {/* Enhanced metadata display */}
                      {response.metadata?.suggestions && response.metadata.suggestions.length > 0 && (
                        <div className="glassmorphism border border-white/20 p-4 rounded-lg">
                          <h4 className="font-medium text-white mb-2 flex items-center">
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI Suggestions
                          </h4>
                          <div className="space-y-2">
                            {response.metadata.suggestions.map((suggestion, index) => (
                              <div key={index} className="p-2 bg-white/5 rounded border-l-2 border-indigo-500/50">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {suggestion.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-white/80">{suggestion.description}</p>
                                {suggestion.code && (
                                  <CodeBlock
                                    code={suggestion.code}
                                    language="typescript"
                                    className="mt-2"
                                    actions={{ copy: true }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {response.metadata?.issues && response.metadata.issues.length > 0 && (
                        <div className="glassmorphism border border-white/20 p-4 rounded-lg">
                          <h4 className="font-medium text-white mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Issues Found
                          </h4>
                          <div className="space-y-2">
                            {response.metadata.issues.map((issue, index) => (
                              <div key={index} className={`p-2 rounded border-l-2 ${
                                issue.severity === 'high' ? 'border-red-500/50 bg-red-500/10' :
                                issue.severity === 'medium' ? 'border-yellow-500/50 bg-yellow-500/10' :
                                'border-blue-500/50 bg-blue-500/10'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {issue.type}
                                  </Badge>
                                  <Badge className={`text-xs ${
                                    issue.severity === 'high' ? 'bg-red-500/20 text-red-200' :
                                    issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                                    'bg-blue-500/20 text-blue-200'
                                  }`}>
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-white/80 mb-1">{issue.description}</p>
                                <p className="text-xs text-white/60">{issue.suggestion}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {response.metadata?.generatedCode && (
                    <TabsContent value="code" className="h-full mt-4 overflow-hidden">
                      <div className="h-full overflow-y-auto pr-2">
                        <div className="glassmorphism border border-white/20 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-white flex items-center">
                              <Code className="h-4 w-4 mr-1" />
                              Generated Code
                              {response.metadata.language && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {response.metadata.language}
                                </Badge>
                              )}
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(response.metadata!.generatedCode!, 'Code')}
                                className="border-white/20 bg-white/10 text-white"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadCode(
                                  response.metadata!.generatedCode!, 
                                  `generated-${response.intent.type}.${response.metadata!.language === 'typescript' ? 'ts' : 'js'}`
                                )}
                                className="border-white/20 bg-white/10 text-white"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-[500px]">
                            <CodeBlock
                              code={response.metadata.generatedCode}
                              language={response.metadata.language || 'typescript'}
                              actions={{
                                copy: true,
                                download: true
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  )}

                  {response.filesReferences && response.filesReferences.length > 0 && (
                    <TabsContent value="files" className="h-full mt-4 overflow-hidden">
                      <div className="h-full overflow-y-auto pr-2">
                        <div className='h-[60vh]'>
                          <CodeReferences filesReferences={response.filesReferences} className='h-full' />
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            )}
          </div>
          
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <Button 
              type="button" 
              onClick={() => setOpen(false)} 
              className='w-full bg-gradient-to-r from-indigo-600 to-indigo-800'
            >
              Close 
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GlassmorphicCard className='relative col-span-3'>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              AI Assistant
            </span>
            {intentPreview && (
              <Badge className={`text-xs ${getIntentColor(intentPreview.type)}`}>
                {getIntentIcon(intentPreview.type)}
                <span className="ml-1">{intentPreview.type.replace('_', ' ')}</span>
                <span className="ml-1">({Math.round(intentPreview.confidence * 100)}%)</span>
              </Badge>
            )}
          </div>
          
          {!response && <SmartSuggestions />}
          
          {/* Smart Input Suggestions */}
          <SmartInputSuggestions
            currentInput={question}
            onSuggestionSelect={(suggestion) => setQuestion(suggestion)}
            projectContext={projectContext}
          />

          {/* Context-Aware File Selector */}
          {availableFiles.length > 0 && (
            <div className="mb-4">
              <ContextAwareFileSelector
                availableFiles={availableFiles}
                selectedFiles={selectedFiles}
                onFileSelectionChange={setSelectedFiles}
                currentQuery={question}
              />
            </div>
          )}
          
          <div>
            <Textarea 
              placeholder='Ask me to generate code, review existing code, debug issues, explain functionality, or answer questions about your codebase...' 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onSubmit(e as any);
                }
              }}
            />
            <div className="h-4"></div>
            <Button 
              disabled={loading || !question.trim()} 
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900"
              onClick={(e) => {
                setOpen(true);
                onSubmit(e as any);
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ask Aetheria AI
                </>
              )}
            </Button>
          </div>
        </div>
      </GlassmorphicCard>
    </>
  );
};

// Main exported component with providers
const EnhancedAskQuestionCard = () => {
  return (
    <IntentClassifierProvider>
      <EnhancedAskQuestionCardContent />
    </IntentClassifierProvider>
  );
};

export default EnhancedAskQuestionCard;