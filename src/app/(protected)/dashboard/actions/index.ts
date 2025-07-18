// src/app/(protected)/dashboard/actions/index.ts
'use server'

import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';

// Import configurations
import { google, MODEL_CONFIG } from './config/ai-config';
import { getSearchConfig } from './config/search-config';

// Import prompt builders
import { 
  buildIntentAwarePrompt, 
  buildCodeGenerationPrompt, 
  buildDebugPrompt, 
  buildCodeImprovementPrompt 
} from './prompts/prompt-builder';

// Import analysis functions
import { getProjectContext } from './analysis/project-context';

// Import database operations
import { performVectorSearch, performDebugVectorSearch } from './database/vector-search';
import { getFilesByNames, formatFileContext, formatFileContextWithRelevance } from './database/file-operations';

// Import types
import type { 
  StreamResponse, 
  CodeGenerationRequirements, 
  ImprovementRequirements,
  ImprovementType 
} from './types/action-types';

/**
 * Enhanced askQuestion function with intent awareness
 */
export async function askQuestion(
  question: string, 
  projectId: string, 
  intent?: string
): Promise<StreamResponse> {
  const stream = createStreamableValue();
  
  // Get search configuration based on intent
  const searchConfig = getSearchConfig(intent);
  
  // Perform vector search
  const result = await performVectorSearch(question, projectId, searchConfig);
  
  // Build context string
  let context = '';
  for (const doc of result) {
    context += `source: ${doc.fileName}\ncode content:${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
  }
  
  // Build intent-aware prompt
  const systemPrompt = buildIntentAwarePrompt(intent, question, context);
  
  // Stream the response
  (async () => {
    const { textStream } = await streamText({
      model: google(MODEL_CONFIG.QUESTION_ANSWERING),
      prompt: systemPrompt
    });
    
    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();
  
  return {
    output: stream.value,
    filesReferences: result
  };
}

/**
 * Generate code based on requirements and project context
 */
export async function generateCode(
  prompt: string, 
  projectId: string, 
  requirements?: CodeGenerationRequirements
): Promise<StreamResponse> {
  const stream = createStreamableValue();
  
  // Get project context for better code generation
  const projectContext = await getProjectContext(projectId);
  
  // Build generation prompt
  const generationPrompt = buildCodeGenerationPrompt(prompt, projectContext, requirements);
  
  // Stream the response
  (async () => {
    const { textStream } = await streamText({
      model: google(MODEL_CONFIG.CODE_GENERATION),
      prompt: generationPrompt
    });
    
    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();
  
  return {
    output: stream.value,
    context: projectContext
  };
}

/**
 * Improve existing code with specific goals
 */
export async function improveCode(
  code: string,
  improvementGoals: string,
  projectId: string,
  improvementType: ImprovementType = 'optimization'
): Promise<StreamResponse> {
  const stream = createStreamableValue();
  
  // Get project context
  const projectContext = await getProjectContext(projectId);
  
  // Build improvement prompt
  const improvementPrompt = buildCodeImprovementPrompt(
    code, 
    improvementGoals, 
    projectContext, 
    improvementType
  );
  
  // Stream the response
  (async () => {
    const { textStream } = await streamText({
      model: google(MODEL_CONFIG.CODE_IMPROVEMENT),
      prompt: improvementPrompt
    });
    
    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();
  
  return {
    output: stream.value,
    originalCode: code
  };
}

/**
 * Debug code issues with AI assistance
 */
export async function debugCode(
  errorDescription: string,
  projectId: string,
  suspectedFiles?: string[]
): Promise<StreamResponse> {
  const stream = createStreamableValue();
  
  let context = '';
  
  if (suspectedFiles && suspectedFiles.length > 0) {
    // Get specific suspected files
    const fileContents = await getFilesByNames(projectId, suspectedFiles);
    context = formatFileContext(fileContents);
  } else {
    // Use vector search to find relevant files
    const relevantFiles = await performDebugVectorSearch(errorDescription, projectId);
    context = formatFileContextWithRelevance(relevantFiles);
  }
  
  // Build debug prompt
  const debugPrompt = buildDebugPrompt(errorDescription, context);
  
  // Stream the response
  (async () => {
    const { textStream } = await streamText({
      model: google(MODEL_CONFIG.DEBUG_ASSISTANCE),
      prompt: debugPrompt
    });
    
    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();
  
  return {
    output: stream.value,
    relevantFiles: suspectedFiles || []
  };
}

// Export all functions for backward compatibility
export { askQuestion as default };