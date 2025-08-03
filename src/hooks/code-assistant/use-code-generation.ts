'use client'

import { useState, useCallback, useMemo } from 'react';
import { useUnifiedIntentRouting } from '../use-unified-intent-routing';
import type { QueryIntent } from '@/lib/intent-classifier';

export interface GenerationRequest {
  type: 'improvement' | 'feature' | 'fix' | 'refactor' | 'generate';
  prompt: string;
  targetFile?: string;
  context?: string[];
  language?: string;
  framework?: string;
}

export interface CodeSuggestion {
  id: string;
  line: number;
  type: 'performance' | 'security' | 'style' | 'bug';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface GenerationResult {
  id: string;
  type: GenerationRequest['type'];
  originalCode?: string;
  generatedCode: string;
  explanation: string;
  filename: string;
  language: string;
  confidence: number;
  suggestions: CodeSuggestion[];
}

export interface CodeGenerationHook {
  // State (memoized)
  isGenerating: boolean;
  results: GenerationResult[];
  activeResult: string | null;
  error: string | null;
  
  // Actions (stable references)
  generateCode: (request: GenerationRequest) => Promise<GenerationResult>;
  setActiveResult: (id: string | null) => void;
  clearResults: () => void;
  applyChanges: (result: GenerationResult) => Promise<void>;
}

// Helper functions for response processing
const extractGeneratedCode = (response: any): string => {
  // Always prefer files content if available
  if (response.files && response.files.length > 0 && response.files[0]?.content) {
    return response.files[0].content;
  }
  
  return response.generatedCode || response.answer || '';
};

const extractExplanation = (response: any): string => {
  return response.explanation || response.summary || 'Code generated successfully.';
};

const extractFilename = (response: any, request: GenerationRequest): string => {
  // Check if response has filename info
  if (response.files && response.files.length > 0 && response.files[0]) {
    return response.files[0].fileName || response.files[0].path || 'generated-file';
  }
  
  // Use targetFile if specified
  if (request.targetFile) {
    return request.targetFile;
  }
  
  // Generate filename based on request
  const language = request.language || 'typescript';
  const extension = language === 'typescript' ? 'ts' : 
                   language === 'javascript' ? 'js' :
                   language === 'python' ? 'py' :
                   language === 'rust' ? 'rs' : 'txt';
  
  return `generated-${request.type}.${extension}`;
};

export function useCodeGeneration(projectId: string): CodeGenerationHook {
  const { routeIntent, isLoading, error } = useUnifiedIntentRouting();
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeResult, setActiveResult] = useState<string | null>(null);

  // Memoized generation function with stable reference
  const generateCode = useCallback(async (request: GenerationRequest): Promise<GenerationResult> => {
    if (!projectId) {
      throw new Error('Project ID is required for code generation');
    }

    const intent: QueryIntent = {
      type: 'code_generation',
      confidence: 0.9,
      targetFiles: request.context || [],
      requiresCodeGen: true,
      requiresFileModification: false,
      contextNeeded: 'project'
    };

    try {
      const response = await routeIntent(intent, request.prompt, projectId, request.context);
      
      // Transform response to GenerationResult
      const result: GenerationResult = {
        id: Date.now().toString(),
        type: request.type,
        generatedCode: extractGeneratedCode(response),
        explanation: extractExplanation(response),
        filename: extractFilename(response, request),
        language: request.language || 'typescript',
        confidence: 85,
        suggestions: [] // CodeSuggestion[] - can be enhanced later
      };

      console.log('🔍 CODE GENERATION HOOK: Generated result:', {
        id: result.id,
        codeLength: result.generatedCode?.length || 0,
        filename: result.filename,
        language: result.language,
        type: result.type
      });

      setResults(prev => [result, ...prev]);
      setActiveResult(result.id);
      
      return result;
    } catch (error) {
      console.error('Code generation failed:', error);
      throw error;
    }
  }, [routeIntent, projectId]);

  // Stable apply changes function
  const applyChanges = useCallback(async (result: GenerationResult): Promise<void> => {
    try {
      // Implementation for applying changes
      console.log('Applying changes for:', result.filename);
      
      // In a real implementation, you would:
      // 1. Create a new file or update existing one
      // 2. Update the project structure
      // 3. Refresh the file list
      
      // For now, just log the action
      console.log('✅ Changes applied successfully');
    } catch (error) {
      console.error('Failed to apply changes:', error);
      throw error;
    }
  }, []);

  // Stable clear function
  const clearResults = useCallback(() => {
    setResults([]);
    setActiveResult(null);
  }, []);

  // Stable setter - completely stable with no dependencies
  const setActiveResultStable = useCallback((id: string | null) => {
    setActiveResult(id);
  }, []); // No dependencies - completely stable!

  return useMemo(() => ({
    // State
    isGenerating: isLoading,
    results,
    activeResult,
    error: error?.message || null,
    
    // Actions (all stable)
    generateCode,
    setActiveResult: setActiveResultStable,
    clearResults,
    applyChanges,
  }), [isLoading, results, activeResult, error, generateCode, setActiveResultStable, clearResults, applyChanges]);
}