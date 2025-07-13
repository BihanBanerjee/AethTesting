import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import useProject from '@/hooks/use-project';
import { useIntentClassifier } from '@/components/code-assistant/intent-classifier-wrapper';
import type { Message, ProcessingStage, ActiveTab } from '@/types/code-assistant';
import { detectDetailLevel, detectImprovementType, detectReviewType, extractConstraints, extractFeatures } from '@/utils/use-code-assistant-utils';

export function useCodeAssistant() {
  const { project } = useProject();
  const { classifyQuery, isReady } = useIntentClassifier();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  
  // Processing states
  const [currentIntent, setCurrentIntent] = useState<string>('');
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('complete');
  const [progress, setProgress] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // API mutations
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
    }
  );

  useEffect(() => {
    if (projectFiles) {
      setAvailableFiles(projectFiles.map(f => f.fileName) || []);
    }
  }, [projectFiles]);

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
      response = await routeIntentToAPI(intent, input, project.id);

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

  const routeIntentToAPI = async (intent: any, input: string, projectId: string) => {
    switch (intent.type) {
      case 'code_generation':
        setProcessingStage('generating');
        setProgress(70);
        
        return await generateCode.mutateAsync({
          projectId,
          prompt: input,
          context: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          requirements: {
            framework: 'react',
            language: 'typescript',
            features: extractFeatures(input),
            constraints: extractConstraints(input)
          }
        });
        
      case 'code_improvement':
        return await improveCode.mutateAsync({
          projectId,
          suggestions: input,
          targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          improvementType: detectImprovementType(input)
        });
        
      case 'code_review':
        return await reviewCode.mutateAsync({
          projectId,
          files: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [],
          reviewType: detectReviewType(input),
          focusAreas: input
        });
        
      case 'debug':
        return await debugCode.mutateAsync({
          projectId,
          errorDescription: input,
          suspectedFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          contextLevel: intent.contextNeeded || 'project'
        });
        
      case 'explain':
        return await explainCode.mutateAsync({
          projectId,
          query: input,
          targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          detailLevel: detectDetailLevel(input)
        });
        
      default:
        return await askQuestion.mutateAsync({
          projectId,
          query: input,
          contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
          intent: intent.type
        });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    selectedFiles,
    setSelectedFiles,
    activeTab,
    setActiveTab,
    availableFiles,
    currentIntent,
    processingStage,
    progress,
    
    // Refs
    messagesEndRef,
    textareaRef,
    
    // Handlers
    handleSendMessage,
    handleKeyPress,
    
    // Project context
    project,
    projectContext: {
      availableFiles,
      techStack: ['React', 'TypeScript', 'Next.js'], // This could come from project analysis
      recentQueries: [] // Could store recent queries
    }
  };
}