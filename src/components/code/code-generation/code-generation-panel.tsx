// src/components/code/code-generation-panel.tsx - Modularized version
'use client'

import React, { useState } from 'react';
import { GenerationInputForm } from './generation-input-form';
import { GenerationResultsList } from './generation-results-list';
import type { GenerationRequest, GenerationResult, CodeGenerationPanelProps } from '../shared/types';


export const CodeGenerationPanel: React.FC<CodeGenerationPanelProps> = ({
  availableFiles,
  onGenerate,
  onApplyChanges
}) => {
  const [request, setRequest] = useState<GenerationRequest>({
    type: 'improvement',
    prompt: '',
    context: [],
    language: 'typescript'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeResult, setActiveResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!request.prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await onGenerate(request);
      setResults(prev => [result, ...prev]);
      setActiveResult(result.id);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async (result: GenerationResult) => {
    try {
      await onApplyChanges(result);
    } catch (error) {
      console.error('Failed to apply changes:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <GenerationInputForm
        availableFiles={availableFiles}
        request={request}
        onRequestChange={setRequest}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
      
      <GenerationResultsList
        results={results}
        activeResult={activeResult}
        onResultSelect={setActiveResult}
        onApplyChanges={handleApply}
      />
    </div>
  );
};