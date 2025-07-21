// src/app/(protected)/code-assistant/page.tsx - Complete Implementation
'use client'

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Code, FileText } from 'lucide-react';

// Components
import { ChatHeader } from '@/components/code-assistant/chat-header';
import { MessageDisplay } from '@/components/code-assistant/message-display';
import { ChatInput } from '@/components/code-assistant/chat-input';
import { EmptyState } from '@/components/code-assistant/empty-state';
import { IntentProgressTracker } from '@/components/code-assistant/intent-progress-tracker';
import { SmartInputSuggestions } from '@/components/code-assistant/smart-input-suggestion';
import { CodeGenerationPanel } from '@/components/code/code-generation';
import { ContextAwareFileSelector } from '@/components/code-assistant/context-aware-file-selector';
import { IntentClassifierProvider } from '@/components/code-assistant/intent-classifier-wrapper';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';

// Hooks
import { useCodeAssistant } from '@/hooks/use-code-assistant';
import { api } from '@/trpc/react';

const CodeAssistantPageContent = () => {
  const {
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
    projectContext
  } = useCodeAssistant();


  const handleRemoveFile = (file: string) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };
  
  return (
    <div className="h-full flex flex-col text-white">
      <ChatHeader projectName={project?.name} />

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
              {messages.length === 0 && <EmptyState />}
              
              {messages.map((message) => (
                <MessageDisplay key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <GlassmorphicCard className="p-4 bg-white/10">
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
                </GlassmorphicCard>
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

          {/* Chat Input */}
          
          <ChatInput
            input={input}
            setInput={setInput}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
            isLoading={isLoading}
            selectedFiles={selectedFiles}
            onRemoveFile={handleRemoveFile}
            textareaRef={textareaRef}
          />
        </TabsContent>

        <TabsContent value="generation" className="flex-1 mt-4">
          <CodeGenerationPanel
            projectId={project?.id || ''}
            availableFiles={availableFiles}
            onGenerate={async (request) => {
              // Use the same API mutation from the hook
              const generateCode = api.project.generateCode.useMutation();
              
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
              console.log('Applying changes:', result);
              // In a real implementation, you would:
              // 1. Create a new file or update existing one
              // 2. Update the project structure
              // 3. Refresh the file list
              return Promise.resolve();
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