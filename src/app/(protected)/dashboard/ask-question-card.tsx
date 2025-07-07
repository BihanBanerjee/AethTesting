// src/app/(protected)/dashboard/ask-question-card.tsx - Updated with Integration
'use client'
import MDEditor from '@uiw/react-md-editor'
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useProject from '@/hooks/use-project'
import Image from 'next/image';
import React, { useState, useEffect } from 'react'
import CodeReferences from './code-references';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import useRefetch from '@/hooks/use-refetch';
import { 
  Bot, 
  Save, 
  Code, 
  Zap, 
  Search, 
  Bug, 
  Wrench, 
  Lightbulb,
  Copy,
  Download,
  FileText,
  Settings,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { GlassmorphicCard, GlassmorphicCardHeader, GlassmorphicCardTitle, GlassmorphicCardContent } from '@/components/ui/glassmorphic-card';
import { motion, AnimatePresence } from 'framer-motion';

// Import the isolated components
import { IntentClassifierProvider, useIntentClassifier } from '@/components/code-assistant/intent-classifier-wrapper';
import { IntentProgressTracker } from '@/components/code-assistant/intent-progress-tracker';
import { SmartInputSuggestions } from '@/components/code-assistant/smart-input-suggestion';
import { ContextAwareFileSelector } from '@/components/code-assistant/context-aware-file-selector';
import { CodeBlock } from '@/components/code/enhanced-code-block';
import { DiffViewer } from '@/components/code/diff-viewer';

// Enhanced response structure
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
      default: return <Bot className="h-4 w-4" />;
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
            content: result.explanation || 'Code generated successfully',
            intent,
            metadata: {
              generatedCode: result.generatedCode,
              language: result.language,
              warnings: result.warnings,
              dependencies: result.dependencies,
              files: result.files?.map((f: any) => f.path) || []
            }
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
            content: result.explanation || 'Code improvements generated',
            intent,
            metadata: {
              generatedCode: result.improvedCode,
              diff: result.diff,
              suggestions: result.suggestions
            }
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
            content: result.summary || 'Code review completed',
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
            content: result.diagnosis || 'Debug analysis completed',
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
            content: result.explanation || 'Code explanation provided',
            intent,
            metadata: {
              files: result.filesAnalyzed
            }
          });
          break;

        default:
          // Fallback to general Q&A
          const qaResult = await askQuestion.mutateAsync({
            projectId: project.id,
            query: question,
            contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles
          });

          setResponse({
            type: 'answer',
            content: qaResult.answer || '',
            intent,
            filesReferences: qaResult.filesReferences
          });
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

  const saveCurrentResponse = () => {
    if (!response || !project) return;

    saveAnswer.mutate({
      projectId: project.id,
      question,
      answer: response.content,
      filesReferences: response.filesReferences || []
    }, {
      onSuccess: () => {
        toast.success('Response saved successfully');
        refetch();
      },
      onError: () => {
        toast.error('Failed to save response');
      }
    });
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
        <DialogContent className='sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col glassmorphism border border-white/20'>
          <DialogHeader className="pr-10">
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
                  
                  <Button 
                    disabled={saveAnswer.isPending} 
                    variant={'outline'} 
                    size="sm"
                    className="border-white/20 bg-white/10 text-white"
                    onClick={saveCurrentResponse}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {loading && (
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
            )}
            
            {response && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-white/10 flex-shrink-0">
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

                <div className="flex-1 overflow-auto mt-4">
                  <TabsContent value="response" className="h-full">
                    <div className="space-y-4">
                      <MDEditor.Markdown 
                        source={response.content} 
                        className='w-full overflow-auto custom-markdown' 
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                          color: 'white',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                        }}
                      />

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
                    <TabsContent value="code" className="h-full">
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
                        <CodeBlock
                          code={response.metadata.generatedCode}
                          language={response.metadata.language || 'typescript'}
                          actions={{
                            copy: true,
                            download: true
                          }}
                        />
                      </div>
                    </TabsContent>
                  )}

                  {response.filesReferences && response.filesReferences.length > 0 && (
                    <TabsContent value="files" className="h-full">
                      <CodeReferences filesReferences={response.filesReferences} />
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            )}
          </div>
          
          <div className="mt-4 flex-shrink-0">
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
        <GlassmorphicCardHeader>
          <GlassmorphicCardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              AI Assistant
            </span>
            {intentPreview && (
              <Badge className={`text-xs ${getIntentColor(intentPreview.type)}`}>
                {getIntentIcon(intentPreview.type)}
                <span className="ml-1">{intentPreview.type.replace('_', ' ')}</span>
                <span className="ml-1">({Math.round(intentPreview.confidence * 100)}%)</span>
              </Badge>
            )}
          </GlassmorphicCardTitle>
        </GlassmorphicCardHeader>
        <GlassmorphicCardContent>
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
        </GlassmorphicCardContent>
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