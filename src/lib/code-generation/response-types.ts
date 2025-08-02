// Response types for code generation AI service endpoints
// Moved from src/types/unified-response.ts for better domain organization

export interface UnifiedResponse {
  // Core response content
  content: string;
  contentType: 'text' | 'code' | 'markdown' | 'json';
  
  // Intent classification
  intent: string;
  confidence: number;
  
  // File-related data
  files?: FileReference[];
  generatedCode?: string;
  language?: string;
  
  // Analysis and improvements
  explanation?: string;
  suggestions?: Suggestion[];
  warnings?: string[];
  insights?: string[];        // Educational content (key points, explanations)
  
  // Code-specific metadata
  diff?: string;
  dependencies?: string[];
  
  // Error handling
  error?: string;
  fallbackUsed?: boolean;
}

export interface FileReference {
  path: string;
  fileName: string;
  content?: string;
  language?: string;
  changeType?: 'create' | 'modify' | 'delete' | 'replace';
  lineNumbers?: number[];
}

export interface Suggestion {  
  type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
  description: string;
  code?: string;
  priority?: 'high' | 'medium' | 'low';
}

// Response transformation utilities
export class ResponseTransformer {
  
  /**
   * Transform legacy AI service responses to unified format
   */
  static transformLegacyResponse(response: any, intent: string): UnifiedResponse {
    // Handle different legacy response formats
    
    // Code improvement response format
    if ('improvedCode' in response) {
      return {
        content: response.explanation || response.improvedCode || '',
        contentType: 'code',
        intent,
        confidence: 0.8,
        generatedCode: response.improvedCode,
        language: response.language || 'text',
        explanation: response.explanation,
        diff: response.diff,
        suggestions: response.suggestions || [],
        warnings: response.warnings || []
      };
    }
    
    // Code generation response format
    if ('files' in response && Array.isArray(response.files)) {
      const primaryFile = response.files[0];
      return {
        content: response.explanation || primaryFile?.content || '',
        contentType: 'code',
        intent,
        confidence: 0.8,
        files: response.files.map((file: any) => ({
          path: file.path,
          fileName: file.path.split('/').pop() || file.path,
          content: file.content,
          language: file.language,
          changeType: file.changeType || 'create'
        })),
        generatedCode: primaryFile?.content,
        language: primaryFile?.language || 'text',
        explanation: response.explanation,
        warnings: response.warnings || [],
        dependencies: response.dependencies || []
      };
    }
    
    // Simple response format (questions, explanations)
    if ('answer' in response) {
      return {
        content: response.answer || '',
        contentType: 'text',
        intent,
        confidence: 0.8,
        explanation: response.explanation,
        files: response.filesReferences?.map((file: any) => ({
          path: file.path || '',
          fileName: file.fileName || '',
          content: file.content,
          language: file.language
        })) || []
      };
    }
    
    // Debug/review response format
    if ('analysis' in response) {
      return {
        content: response.analysis || '',
        contentType: 'text',
        intent,
        confidence: 0.8,
        explanation: response.analysis,
        suggestions: response.suggestions || [],
        warnings: response.issues || []
      };
    }
    
    // Fallback for unknown formats
    const content = response.content || response.text || response.result || JSON.stringify(response);
    return {
      content,
      contentType: 'text',
      intent,
      confidence: 0.5,
      explanation: 'Response format not recognized, using fallback',
      fallbackUsed: true
    };
  }
  
  /**
   * Extract content for message display
   */
  static extractDisplayContent(response: UnifiedResponse): string {
    if (response.generatedCode) {
      return response.generatedCode;
    }
    if (response.content) {
      return response.content;
    }
    if (response.explanation) {
      return response.explanation;
    }
    return 'No content available';
  }
  
  /**
   * Extract language for syntax highlighting
   */
  static extractLanguage(response: UnifiedResponse): string {
    if (response.language) {
      return response.language;
    }
    
    // Try to detect from content type
    switch (response.contentType) {
      case 'code':
        return 'typescript'; // Default for code
      case 'markdown':
        return 'markdown';
      case 'json':
        return 'json';
      default:
        return 'text';
    }
  }
}