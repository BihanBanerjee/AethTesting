// src/lib/code-generation/unified-response-adapter.ts
import type { CodeGenerationResult } from "./types";
import type { UnifiedResponse, FileReference, Suggestion } from "./response-types";
import { MessageClassifier } from "./message-classifier";

/**
 * Adapter to transform CodeGenerationResult to UnifiedResponse format
 * Ensures consistent response format across all AI operations
 */
export class UnifiedResponseAdapter {
  /**
   * Transform CodeGenerationResult to UnifiedResponse format
   */
  static adaptCodeGenerationResult(
    result: CodeGenerationResult, 
    intent: string, 
    confidence: number = 0.8
  ): UnifiedResponse {
    const primaryFile = result.files?.[0];
    
    return {
      content: result.explanation || 'Operation completed successfully',
      contentType: this.determineContentType(result, intent),
      intent,
      confidence,
      generatedCode: primaryFile?.content,
      language: primaryFile?.language || 'typescript',
      explanation: result.explanation,
      suggestions: this.transformWarningsToSuggestions(result.warnings || []),
      files: this.transformGeneratedFiles(result.files),
      warnings: MessageClassifier.filterUserFacingWarnings(result.warnings || []),
      insights: MessageClassifier.extractInsights(result.warnings || []),
      dependencies: result.dependencies || [],
      diff: primaryFile?.diff
    };
  }

  /**
   * Transform review/debug results to UnifiedResponse format
   */
  static adaptAnalysisResult(
    analysisData: any,
    intent: string,
    confidence: number = 0.8
  ): UnifiedResponse {
    // Handle review results
    if ('issues' in analysisData && 'suggestions' in analysisData) {
      return {
        content: analysisData.summary || 'Code review completed',
        contentType: 'text',
        intent,
        confidence,
        explanation: analysisData.summary,
        suggestions: this.transformReviewSuggestions(analysisData.suggestions || []),
        warnings: analysisData.issues?.map((issue: any) => 
          `${issue.severity}: ${issue.description} (${issue.file}:${issue.line})`
        ) || [],
        files: []
      };
    }

    // Handle debug results
    if ('diagnosis' in analysisData && 'solutions' in analysisData) {
      return {
        content: analysisData.diagnosis || 'Debug analysis completed',
        contentType: 'text',
        intent,
        confidence,
        explanation: analysisData.diagnosis,
        suggestions: this.transformDebugSolutions(analysisData.solutions || []),
        warnings: analysisData.investigationSteps || [],
        files: []
      };
    }

    // Handle explain results
    if ('explanation' in analysisData && 'keyPoints' in analysisData) {
      return {
        content: analysisData.explanation || 'Code explanation completed',
        contentType: 'markdown',
        intent,
        confidence,
        explanation: analysisData.explanation,
        suggestions: this.transformExplanationToSuggestions(analysisData),
        warnings: [],
        files: []
      };
    }

    // Fallback for unknown analysis formats
    return {
      content: analysisData.summary || analysisData.result || 'Analysis completed',
      contentType: 'text',
      intent,
      confidence: 0.5,
      explanation: 'Analysis result in unknown format',
      fallbackUsed: true
    };
  }

  /**
   * Determine appropriate content type based on result and intent
   */
  private static determineContentType(result: CodeGenerationResult, intent: string): 'text' | 'code' | 'markdown' | 'json' {
    // Code generation and modification intents produce code
    if (['code_generation', 'code_improvement', 'refactor'].includes(intent)) {
      return 'code';
    }

    // Explanation intents typically produce markdown
    if (intent === 'explain') {
      return 'markdown';
    }

    // Review and debug typically produce structured text
    if (['code_review', 'debug'].includes(intent)) {
      return 'text';
    }

    // Default based on file content
    if (result.files.length > 0 && result.files[0].content) {
      return 'code';
    }

    return 'text';
  }

  /**
   * Transform GeneratedFile[] to FileReference[]
   */
  private static transformGeneratedFiles(files: Array<{ path: string; content: string; language: string; changeType: string; }>): FileReference[] {
    return files.map(file => ({
      path: file.path,
      fileName: file.path.split('/').pop() || file.path,
      content: file.content,
      language: file.language,
      changeType: file.changeType as 'create' | 'modify' | 'delete' | 'replace'
    }));
  }

  /**
   * Transform warnings array to Suggestion[]
   */
  private static transformWarningsToSuggestions(warnings: string[]): Suggestion[] {
    // Filter to only get actionable suggestions, avoid duplicating warnings
    const suggestionMessages = MessageClassifier.filterUserFacingSuggestions(warnings);
    
    return suggestionMessages.map(message => ({
      type: 'improvement' as const,
      description: message,
      priority: 'medium' as const
    }));
  }

  /**
   * Transform review suggestions to unified format
   */
  private static transformReviewSuggestions(suggestions: any[]): Suggestion[] {
    return suggestions.map(suggestion => ({
      type: suggestion.type === 'optimization' ? 'optimization' as const : 'improvement' as const,
      description: suggestion.description,
      priority: 'medium' as const
    }));
  }

  /**
   * Transform debug solutions to suggestions
   */
  private static transformDebugSolutions(solutions: any[]): Suggestion[] {
    return solutions.map(solution => ({
      type: solution.type === 'fix' ? 'bug_fix' as const : 'improvement' as const,
      description: solution.description,
      code: solution.code,
      priority: solution.priority === 'high' ? 'high' as const : 
                solution.priority === 'low' ? 'low' as const : 'medium' as const
    }));
  }

  /**
   * Transform explanation data to suggestions
   */
  private static transformExplanationToSuggestions(explanationData: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Add key points as informational suggestions
    if (explanationData.keyPoints) {
      suggestions.push(...explanationData.keyPoints.map((point: string) => ({
        type: 'improvement' as const,
        description: `Key Point: ${point}`,
        priority: 'medium' as const
      })));
    }

    // Add recommendations as actionable suggestions
    if (explanationData.recommendations) {
      suggestions.push(...explanationData.recommendations.map((rec: string) => ({
        type: 'optimization' as const,
        description: rec,
        priority: 'medium' as const
      })));
    }

    return suggestions;
  }
}