import type { EnhancedResponse, EnhancedMetadata } from '../types/enhanced-save-button.types';
import { createEnhancedFileReferences } from './file-references';

export function buildEnhancedMetadata(
  response: EnhancedResponse | null,
  selectedFiles: string[],
  feedback?: any
): EnhancedMetadata | {} {
  if (!response) return {};

  const enhancedFilesReferences = createEnhancedFileReferences(response);

  return {
    // Intent classification data
    intent: response.intent ? {
      type: response.intent.type,
      confidence: response.intent.confidence,
      requiresCodeGen: response.intent.requiresCodeGen,
      requiresFileModification: response.intent.requiresFileModification,
      contextNeeded: response.intent.contextNeeded,
      targetFiles: response.intent.targetFiles || []
    } : undefined,

    // Generated code data
    generatedCode: response.metadata?.generatedCode ? {
      content: response.metadata.generatedCode,
      language: response.metadata.language || 'typescript',
      filename: response.metadata.filename || `generated-${response.intent?.type}.${response.metadata.language === 'typescript' ? 'ts' : 'js'}`,
      type: response.type === 'answer' ? 'code_snippet' as const : 
            response.type === 'code' ? 'new_file' as const :
            'code_snippet' as const
    } : undefined,

    // Code improvements data
    improvements: response.intent?.type === 'code_improvement' && response.metadata?.generatedCode ? {
      improvedCode: response.metadata.generatedCode,
      improvementType: 'optimization' as const,
      diff: response.metadata.diff,
      suggestions: response.metadata.suggestions?.map(s => ({
        type: s.type,
        description: s.description,
        code: s.code
      }))
    } : undefined,

    // Code review data
    review: response.intent?.type === 'code_review' ? {
      reviewType: 'comprehensive' as const,
      issues: response.metadata?.issues?.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion
      })),
      summary: response.content
    } : undefined,

    // Debug analysis data
    debug: response.intent?.type === 'debug' ? {
      diagnosis: response.content,
      solutions: response.metadata?.suggestions?.map(s => ({
        type: 'fix' as const,
        description: s.description,
        code: s.code,
        priority: 'medium' as const
      })),
      investigationSteps: []
    } : undefined,

    // Code explanation data
    explanation: response.intent?.type === 'explain' ? {
      detailLevel: 'detailed' as const,
      keyPoints: [],
      codeFlow: [],
      patterns: [],
      dependencies: response.metadata?.dependencies || []
    } : undefined,

    // Refactoring data
    refactor: response.intent?.type === 'refactor' ? {
      refactoredCode: response.metadata?.generatedCode,
      changes: [],
      preserveAPI: true,
      apiChanges: response.metadata?.warnings?.filter(w => w.includes('API')) || []
    } : undefined,

    // Performance metrics
    performance: {
      processingTime: Date.now() - (response.timestamp?.getTime() || Date.now()),
      responseTime: Date.now() - (response.timestamp?.getTime() || Date.now()),
    },

    // Enhanced filesReferences
    filesReferences: enhancedFilesReferences,

    // Context files
    contextFiles: selectedFiles.length > 0 ? selectedFiles : response.metadata?.files || [],

    // User feedback
    userFeedback: feedback,

    // Session info
    sessionId: Date.now().toString(),
    timestamp: new Date()
  };
}