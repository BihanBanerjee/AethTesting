// src/components/code/code-generation-panel.tsx - Modularized version
'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { GenerationInputForm } from './generation-input-form';
import { GenerationResultsList } from './generation-results-list';
import type { GenerationRequest, GenerationResult, CodeGenerationPanelProps } from '../shared/types';

interface PersistedCodeGenState {
  results: GenerationResult[];
  activeResult: string | null;
}

// Check localStorage size for code generation
const validateCodeGenSize = (data: string, key: string): boolean => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit for code generation (larger than messages)
  
  if (data.length > MAX_SIZE) {
    console.warn(`🚨 localStorage: Code generation data for ${key} exceeds 10MB limit (${(data.length / (1024 * 1024)).toFixed(2)}MB)`);
    return false;
  }
  
  return true;
};

// localStorage persistence functions for code generation
const saveCodeGenToStorage = (key: string, state: PersistedCodeGenState) => {
  try {
    if (typeof window !== 'undefined') {
      const dataString = JSON.stringify(state);
      
      // Validate size before storing
      if (!validateCodeGenSize(dataString, key)) {
        console.warn('🚨 Truncating old code generation results due to size limit');
        // Keep only the last 10 results to stay within limits
        const truncatedState = {
          ...state,
          results: state.results.slice(-10)
        };
        const truncatedDataString = JSON.stringify(truncatedState);
        
        if (validateCodeGenSize(truncatedDataString, key)) {
          window.localStorage.setItem(key, truncatedDataString);
          console.log(`✅ Saved ${truncatedState.results.length} code generation results (truncated from ${state.results.length})`);
        } else {
          console.error('❌ Even truncated code generation results exceed storage limits');
        }
        return;
      }
      
      window.localStorage.setItem(key, dataString);
      console.log(`💾 Code Generation: Saved ${state.results.length} results to localStorage`);
    }
  } catch (error) {
    console.error('Error saving code generation results to localStorage:', error);
    
    // Handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('🚨 localStorage quota exceeded for code generation, clearing old data');
      try {
        // Try to clear old results and save current ones
        const truncatedState = {
          ...state,
          results: state.results.slice(-5)
        };
        window.localStorage.setItem(key, JSON.stringify(truncatedState));
        console.log(`✅ Saved ${truncatedState.results.length} code generation results after clearing storage`);
      } catch (fallbackError) {
        console.error('❌ Failed to save code generation results even after clearing storage:', fallbackError);
      }
    }
  }
};

const loadCodeGenFromStorage = (key: string): PersistedCodeGenState | null => {
  try {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) as PersistedCodeGenState : null;
    }
  } catch (error) {
    console.error('Error loading code generation results from localStorage:', error);
  }
  return null;
};

const clearCodeGenFromStorage = (key: string) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error clearing code generation results from localStorage:', error);
  }
};

// Smart auto-detection for language based on file extension and context
const detectLanguageFromFile = (filename?: string, prompt?: string): string => {
  // File extension mapping
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return 'typescript'; // Early return if no extension
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
  const { user, isLoaded } = useUser();
  
  // Create user-specific storage key
  const storageKey = isLoaded && user?.id ? `Aetheria-codeGeneration-results-${user.id}` : null;
  
  const [request, setRequest] = useState<GenerationRequest>({
    type: 'improvement',
    prompt: '',
    context: [],
    language: detectLanguageFromFile() // Use smart detection with fallback to typescript
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const [hasRestored, setHasRestored] = useState(false);

  // Restore results from localStorage when storage key is ready
  useEffect(() => {
    if (storageKey && !hasRestored) {
      console.log('🔄 Code Generation: Restoring results from localStorage');
      const savedState = loadCodeGenFromStorage(storageKey);
      if (savedState && savedState.results.length > 0) {
        console.log(`✅ Code Generation: Restored ${savedState.results.length} results`);
        setResults(savedState.results);
        setActiveResult(savedState.activeResult);
      }
      setHasRestored(true);
    }
  }, [storageKey, hasRestored]);

  // Persist results when they change
  useEffect(() => {
    if (storageKey && hasRestored && (results.length > 0 || activeResult)) {
      console.log('💾 Code Generation: Persisting results to localStorage');
      saveCodeGenToStorage(storageKey, { results, activeResult });
    }
  }, [results, activeResult, storageKey, hasRestored]);

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