import type { QueryIntent } from '@/lib/intent-classifier';
import type { MessageMetadata, CodeSuggestion } from '@/components/code-assistant/types';
import type { StreamableValue } from 'ai/rsc';
import { ResponseTransformer, type UnifiedResponse } from '@/lib/code-generation/response-types';

// Helper function to safely handle potentially malformed responses
function safelyProcessResponse<T>(
  processor: () => T,
  fallback: T,
  context: string = 'response processing'
): T {
  try {
    return processor();
  } catch (error) {
    console.error(`Error during ${context}:`, error);
    return fallback;
  }
}

// Helper function to validate response structure
function validateResponse(response: unknown): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  const res = response as APIResponse;
  
  // At minimum, response should have some form of content
  return !!(
    res.answer || 
    res.explanation || 
    res.response || 
    res.summary || 
    res.diagnosis || 
    res.generatedCode ||
    res.improvedCode ||
    res.refactoredCode ||
    res.codeExplanation
  );
}

// Helper function to detect language from file extensions
function detectLanguageFromFiles(files: string[]): string {
  if (!files || files.length === 0) return 'typescript';
  
  // Get the first file's extension
  const firstFile = files[0];
  if (!firstFile) return 'typescript';
  const extension = firstFile.toLowerCase().split('.').pop();
  
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'kt': 'kotlin',
    'swift': 'swift',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'markdown': 'markdown',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    'dockerfile': 'dockerfile',
    'env': 'bash'
  };
  
  return languageMap[extension || ''] || 'typescript';
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
      
      // For code improvement responses, check if we have full files content first
      if (unifiedRes.intent === 'code_improvement') {
        console.log('🔍 Code improvement response - checking content sources:');
        console.log('  - Files available:', unifiedRes.files?.length || 0);
        console.log('  - First file content length:', unifiedRes.files?.[0]?.content?.length || 0);
        console.log('  - GeneratedCode length:', unifiedRes.generatedCode?.length || 0);
        console.log('  - Content length:', unifiedRes.content?.length || 0);
        
        // Debug: Log first 200 chars of each source
        if (unifiedRes.files?.[0]?.content) {
          console.log('  - Files[0] preview:', unifiedRes.files[0].content.substring(0, 200) + '...');
        }
        if (unifiedRes.generatedCode) {
          console.log('  - GeneratedCode preview:', unifiedRes.generatedCode.substring(0, 200) + '...');
        }
        
        // Priority 1: Use full file content if available and substantial
        if (unifiedRes.files && unifiedRes.files.length > 0 && unifiedRes.files[0]?.content) {
          const fileContent = unifiedRes.files[0].content;
          if (fileContent.length > (unifiedRes.generatedCode?.length || 0)) {
            console.log('✅ Using full file content (', fileContent.length, 'chars)');
            return fileContent;
          }
        }
        
        // Priority 2: Use generatedCode if it looks substantial and valid
        if (unifiedRes.generatedCode) {
          // Check if the generatedCode contains malformed JSON
          if (typeof unifiedRes.generatedCode === 'string' && 
              unifiedRes.generatedCode.includes('"language"') && 
              unifiedRes.generatedCode.includes('"explanation"')) {
            
            console.warn('⚠️ Content extraction: Detected malformed generatedCode, using explanation instead');
            return unifiedRes.explanation || unifiedRes.content || 'Response contained malformed content';
          }
          
          // Unescape newlines and other escaped characters for proper display
          const unescapedContent = unifiedRes.generatedCode
            .replace(/\\n/g, '\n')      // Convert \n to actual newlines
            .replace(/\\r/g, '\r')      // Convert \r to carriage returns  
            .replace(/\\t/g, '\t')      // Convert \t to tabs
            .replace(/\\"/g, '"')       // Convert \" to quotes
            .replace(/\\\\/g, '\\');    // Convert \\ to single backslash
          
          console.log('✅ Using unescaped generatedCode (', unescapedContent.length, 'chars)');
          return unescapedContent;
        }
        
        // Priority 3: Fall back to explanation/content
        console.log('⚠️ Using fallback content for code improvement');
        return unifiedRes.explanation || unifiedRes.content || 'No code improvement content available';
      }
      
      // For other responses, use the standard content extraction
      return ResponseTransformer.extractDisplayContent(unifiedRes);
    }
    
    // Validate response structure for legacy formats
    if (!validateResponse(response)) {
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