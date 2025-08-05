import type { QueryIntent } from '@/lib/intent-classifier';
import type { MessageMetadata, CodeSuggestion } from '@/components/code-assistant/types';
import type { StreamableValue } from 'ai/rsc';
import { ResponseTransformer, type UnifiedResponse } from '@/lib/code-generation/response-types';
import { 
  safelyProcessResponse, 
  validateResponseStructure, 
  sanitizeContent, 
  isMalformedContent 
} from './shared-utilities';

// Use shared utilities - removing duplicate implementations

import { getLanguageFromFilename } from './shared-utilities';

// Helper function to detect language from file extensions
function detectLanguageFromFiles(files: string[]): string {
  if (!files || files.length === 0) return 'typescript';
  
  // Get the first file's extension
  const firstFile = files[0];
  if (!firstFile) return 'typescript';
  
  return getLanguageFromFilename(firstFile);
}

// Define expected API response structure for all intent types
interface APIResponse {
  // Common response fields
  answer?: string | StreamableValue<string>; // Can be string or StreamableValue
  explanation?: string;
  response?: string;
  summary?: string;
  output?: StreamableValue<string>; // StreamableValue from server actions
  filesReferences?: Array<{ fileName: string; sourceCode?: string; summary?: string }>;
  files?: Array<{ fileName: string; path?: string }>;
  
  // Code generation response fields
  generatedCode?: string;
  language?: string;
  warnings?: string[];
  dependencies?: string[];
  
  // Code improvement response fields
  improvedCode?: string;
  diff?: {
    original: string;
    modified: string;
    filename: string;
  };
  improvements?: CodeSuggestion[];
  
  // Code review response fields
  issues?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    message: string;
    line?: number;
    file?: string;
    suggestion?: string;
  }>;
  suggestions?: CodeSuggestion[];
  filesReviewed?: string[];
  qualityScore?: number;
  
  // Debug response fields
  diagnosis?: string;
  rootCause?: string;
  solutions?: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedEffort: string;
  }>;
  suspectedFiles?: string[];
  investigationSteps?: string[];
  
  // Refactor response fields
  refactoredCode?: string;
  refactoringPlan?: {
    goals: string[];
    steps: string[];
    risks: string[];
  };
  
  // Explain response fields
  codeExplanation?: {
    overview: string;
    keyPoints: string[];
    complexity: number;
    recommendations: string[];
  };
}

// Helper function to safely extract content from different API response types
export function extractResponseContent(response: unknown): string | StreamableValue<string> {
  return safelyProcessResponse(() => {
    // First check if this is already a UnifiedResponse
    if (response && typeof response === 'object' && 'content' in response) {
      const unifiedRes = response as UnifiedResponse;
      
      // For code improvement responses, prioritize generatedCode (improved version) over files (original version)
      if (unifiedRes.intent === 'code_improvement') {
        // Priority 1: Use generatedCode if it looks substantial and valid (this contains the improved version)
        if (unifiedRes.generatedCode) {
          // Check if the generatedCode contains malformed JSON
          if (typeof unifiedRes.generatedCode === 'string' && 
              unifiedRes.generatedCode.includes('"language"') && 
              unifiedRes.generatedCode.includes('"explanation"')) {
            
            return unifiedRes.explanation || unifiedRes.content || 'Response contained malformed content';
          }
          
          // Use shared sanitization utility
          return sanitizeContent(unifiedRes.generatedCode);
        }
        
        // Priority 2: Use full file content if generatedCode is not available
        if (unifiedRes.files && unifiedRes.files.length > 0 && unifiedRes.files[0]?.content) {
          return unifiedRes.files[0].content;
        }
        
        // Priority 3: Fall back to explanation/content
        return unifiedRes.explanation || unifiedRes.content || 'No code improvement content available';
      }
      
      // For other responses, use the standard content extraction
      return ResponseTransformer.extractDisplayContent(unifiedRes);
    }
    
    // Validate response structure for legacy formats
    if (!validateResponseStructure(response)) {
      return 'Invalid or empty response received';
    }
    
    const res = response as APIResponse;
    
    // Check for StreamableValue in different properties
    if (res?.output) {
      return res.output;
    }
    
    // Handle StreamableValue responses
    if (res?.answer && typeof res.answer === 'object') {
      return res.answer as StreamableValue<string>;
    }
    
    // Enhanced Smart Chat: handle all response types with intelligent content extraction
    
    // Priority order for content extraction
    const contentSources = [
      res?.answer,           // General Q&A responses
      res?.explanation,      // Code explanations
      res?.summary,          // Code generation summaries
      res?.diagnosis,        // Debug diagnosis
      res?.response,         // General responses
      res?.codeExplanation?.overview, // Detailed code explanations
    ];
    
    // Find the first non-empty content
    for (const content of contentSources) {
      if (content && typeof content === 'string' && content.trim()) {
        return content;
      }
    }
    
    return 'No response received';
  }, 'No response received', 'content extraction');
}

// Helper function to detect response type based on available fields
function detectResponseType(response: unknown, intent?: string): string {
  const res = response as APIResponse;
  
  // Use intent as primary indicator if available
  if (intent) {
    switch (intent) {
      case 'code_generation': return 'code_generation';
      case 'code_improvement': return 'code_improvement';
      case 'code_review': return 'code_review';
      case 'debug': return 'debug';
      case 'refactor': return 'refactor';
      case 'explain': return 'explain';
      default: return 'question';
    }
  }
  
  // Fallback to content-based detection
  if (res?.generatedCode) return 'code_generation';
  if (res?.improvedCode || res?.diff) return 'code_improvement';
  if (res?.issues && Array.isArray(res.issues)) return 'code_review';
  if (res?.diagnosis || res?.solutions) return 'debug';
  if (res?.refactoredCode || res?.refactoringPlan) return 'refactor';
  if (res?.codeExplanation) return 'explain';
  
  return 'question'; // Default fallback
}

// Helper function to safely extract metadata from different API response types
export function extractResponseMetadata(response: unknown, intent: QueryIntent): MessageMetadata {
  return safelyProcessResponse(() => {
    // First check if this is already a UnifiedResponse
    if (response && typeof response === 'object' && 'content' in response) {
      const unifiedRes = response as UnifiedResponse;
      
      // For code improvement and generation, ensure we properly extract the actual content
      let extractedGeneratedCode = unifiedRes.generatedCode;
      
      // Handle cases where generatedCode might be malformed
      if (typeof extractedGeneratedCode === 'string') {
        // Case 1: JSON string
        try {
          if (extractedGeneratedCode.trim().startsWith('{') || extractedGeneratedCode.trim().startsWith('[')) {
            const parsed = JSON.parse(extractedGeneratedCode);
            if (parsed && typeof parsed === 'object' && parsed.content) {
              extractedGeneratedCode = parsed.content;
            }
          }
        } catch {
          // If parsing fails, continue to other checks
        }
        
        // Case 2: Truncated JSON response (contains JSON fields but not valid JSON)
        if (extractedGeneratedCode && extractedGeneratedCode.includes('"language"') && extractedGeneratedCode.includes('"explanation"')) {
          console.warn('⚠️ Metadata extraction: Detected malformed generatedCode, setting to null');
          extractedGeneratedCode = undefined; // Don't show the GeneratedCode section for malformed content
        }
        
        // Case 3: Generic malformed response indicator
        if (extractedGeneratedCode && extractedGeneratedCode.includes('Generated code (extracted from malformed response)')) {
          extractedGeneratedCode = undefined; // Don't show the GeneratedCode section
        }
      }
      
      return {
        files: unifiedRes.files?.map(f => f.fileName).filter(Boolean) as string[] || intent.targetFiles || [],
        generatedCode: extractedGeneratedCode,
        language: ResponseTransformer.extractLanguage(unifiedRes),
        diff: unifiedRes.diff ? {
          original: '',
          modified: unifiedRes.diff,
          filename: unifiedRes.files?.[0]?.fileName || 'unknown'
        } : undefined,
        suggestions: unifiedRes.suggestions || [],
        requiresCodeGen: !!extractedGeneratedCode,
        requiresFileModification: unifiedRes.files?.some(f => f.changeType !== 'create') || false,
        targetFiles: intent.targetFiles,
        responseType: unifiedRes.intent || intent.type
      };
    }
    
    // Handle legacy format
    const res = response as APIResponse;
    const responseType = detectResponseType(response, intent.type);
  
    // Enhanced Smart Chat: handle all response types with appropriate metadata
    const baseMetadata: MessageMetadata = {
      files: res?.filesReferences?.map((f) => f.fileName).filter(Boolean) as string[] || 
             res?.files?.map((f) => f.fileName || f.path).filter(Boolean) as string[] || 
             intent.targetFiles || [],
      generatedCode: undefined,
      language: res?.language || detectLanguageFromFiles(intent.targetFiles || []),
      diff: res?.diff,
      suggestions: res?.suggestions || [],
      requiresCodeGen: false,
      requiresFileModification: false,
      targetFiles: intent.targetFiles,
      responseType: responseType
    };
  
  // Add response-type-specific metadata
  switch (responseType) {
    case 'code_generation':
      const codeGenLanguage = res?.language || baseMetadata.language || 'typescript';
      return {
        ...baseMetadata,
        generatedCode: res?.generatedCode,
        language: codeGenLanguage,
        warnings: res?.warnings,
        dependencies: res?.dependencies,
        requiresCodeGen: true,
        codeGenerationMetadata: {
          language: codeGenLanguage,
          framework: 'react', // Default from our API calls
          warnings: res?.warnings || [],
          dependencies: res?.dependencies || []
        }
      };
      
    case 'code_improvement':
      return {
        ...baseMetadata,
        generatedCode: res?.improvedCode,
        diff: res?.diff,
        suggestions: res?.improvements || res?.suggestions || [],
        requiresFileModification: !!res?.improvedCode,
        improvementMetadata: {
          improvements: res?.improvements || [],
          hasBeforeAfter: !!res?.diff
        }
      };
      
    case 'code_review':
      return {
        ...baseMetadata,
        suggestions: res?.suggestions || [],
        reviewMetadata: {
          issues: res?.issues || [],
          qualityScore: res?.qualityScore,
          filesReviewed: res?.filesReviewed || [],
          criticalIssues: res?.issues?.filter(issue => issue.severity === 'critical') || [],
          totalIssues: res?.issues?.length || 0
        }
      };
      
    case 'debug':
      return {
        ...baseMetadata,
        debugMetadata: {
          rootCause: res?.rootCause,
          solutions: res?.solutions || [],
          suspectedFiles: res?.suspectedFiles || [],
          investigationSteps: res?.investigationSteps || [],
          hasRootCause: !!res?.rootCause,
          solutionsCount: res?.solutions?.length || 0
        }
      };
      
    case 'refactor':
      return {
        ...baseMetadata,
        generatedCode: res?.refactoredCode,
        requiresFileModification: !!res?.refactoredCode,
        refactorMetadata: {
          refactoringPlan: res?.refactoringPlan,
          hasRefactoredCode: !!res?.refactoredCode,
          goals: res?.refactoringPlan?.goals || [],
          risks: res?.refactoringPlan?.risks || []
        }
      };
      
    case 'explain':
      return {
        ...baseMetadata,
        explainMetadata: {
          codeExplanation: res?.codeExplanation,
          complexity: res?.codeExplanation?.complexity,
          keyPoints: res?.codeExplanation?.keyPoints || [],
          recommendations: res?.codeExplanation?.recommendations || []
        }
      };
      
    default:
      // Default Q&A metadata
      return baseMetadata;
    }
  }, {
    // Fallback metadata for malformed responses
    files: intent.targetFiles || [],
    generatedCode: undefined,
    language: undefined,
    diff: undefined,
    suggestions: [],
    requiresCodeGen: false,
    requiresFileModification: false,
    targetFiles: intent.targetFiles,
    responseType: 'question'
  }, 'metadata extraction');
}