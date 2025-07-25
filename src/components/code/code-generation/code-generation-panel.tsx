// src/components/code/code-generation-panel.tsx - Modularized version
'use client'

import React, { useState } from 'react';
import { GenerationInputForm } from './generation-input-form';
import { GenerationResultsList } from './generation-results-list';
import type { GenerationRequest, GenerationResult, CodeGenerationPanelProps } from '../shared/types';

// Smart auto-detection for language based on file extension and context
const detectLanguageFromFile = (filename?: string, prompt?: string): string => {
  // File extension mapping
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mapping: Record<string, string> = {
      'md': 'markdown',
      'markdown': 'markdown',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'css',
      'sass': 'css',
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'xml': 'xml',
      'toml': 'toml',
      'ini': 'ini',
      'env': 'shell',
      'dockerfile': 'dockerfile',
      'tf': 'hcl',
    };
    if (mapping[ext]) return mapping[ext];
  }
  
  // Context-based detection from prompt
  if (prompt) {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('readme') || lowerPrompt.includes('markdown')) return 'markdown';
    if (lowerPrompt.includes('config') || lowerPrompt.includes('json')) return 'json';
    if (lowerPrompt.includes('yaml') || lowerPrompt.includes('yml')) return 'yaml';
    if (lowerPrompt.includes('html')) return 'html';
    if (lowerPrompt.includes('css') || lowerPrompt.includes('style')) return 'css';
    if (lowerPrompt.includes('database') || lowerPrompt.includes('query')) return 'sql';
    if (lowerPrompt.includes('script') || lowerPrompt.includes('bash')) return 'shell';
  }
  
  return 'typescript'; // Final fallback
};


export const CodeGenerationPanel: React.FC<CodeGenerationPanelProps> = ({
  availableFiles,
  onGenerate,
  onApplyChanges
}) => {
  const [request, setRequest] = useState<GenerationRequest>({
    type: 'improvement',
    prompt: '',
    context: [],
    language: detectLanguageFromFile() // Use smart detection with fallback to typescript
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