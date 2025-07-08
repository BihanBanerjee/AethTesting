// src/components/feedback/enhanced-save-button.tsx
'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { FeedbackCollector } from './feedback-collector';

interface EnhancedResponse {
  type: 'answer' | 'code' | 'review' | 'debug' | 'explanation';
  content: string;
  intent: {
    type: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
    confidence: number;
    requiresCodeGen: boolean;
    requiresFileModification: boolean;
    contextNeeded: 'file' | 'function' | 'project' | 'global';
    targetFiles?: string[];
  };
  metadata?: {
    generatedCode?: string;
    language?: string;
    diff?: string;
    suggestions?: Array<{
      type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
      description: string;
      code?: string;
    }>;
    issues?: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      suggestion: string;
    }>;
    files?: string[];
    warnings?: string[];
    dependencies?: string[];
  };
  filesReferences?: {fileName: string; sourceCode: string; summary: string}[];
  timestamp?: Date;
}

interface Project {
  id: string;
  name: string;
}

interface SaveAnswerMutation {
  mutate: (data: any, options?: { onSuccess?: (result: any) => void; onError?: (error: any) => void }) => void;
  isPending: boolean;
}

interface EnhancedSaveButtonProps {
  response: EnhancedResponse | null;
  project: Project | null;
  question: string;
  selectedFiles: string[];
  saveAnswer: SaveAnswerMutation;
  refetch: () => void;
}

export const EnhancedSaveButton: React.FC<EnhancedSaveButtonProps> = ({
  response,
  project,
  question,
  selectedFiles,
  saveAnswer,
  refetch
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  const buildEnhancedMetadata = (feedback?: any) => {
    if (!response) return {};

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

      // Context files
      contextFiles: selectedFiles.length > 0 ? selectedFiles : response.metadata?.files || [],

      // User feedback
      userFeedback: feedback,

      // Session info
      sessionId: Date.now().toString(),
      timestamp: new Date()
    };
  };

  const handleSaveWithFeedback = (feedback?: any) => {
    if (!response || !project) {
      toast.error('No response or project available to save');
      return;
    }

    const enhancedMetadata = buildEnhancedMetadata(feedback);

    console.log('Saving enhanced response with metadata:', enhancedMetadata);

    saveAnswer.mutate({
      projectId: project.id,
      question,
      answer: response.content,
      filesReferences: response.filesReferences || [],
      metadata: enhancedMetadata
    }, {
      onSuccess: (result) => {
        toast.success('Response saved successfully!');
        
        // Show analytics info if available
        if (result?.analytics) {
          const analyticsMsg = [
            result.analytics.aiInteractionCreated && 'AI interaction tracked',
            result.analytics.codeGenerationCreated && 'Code generation recorded',
            result.analytics.fileAnalyticsUpdated > 0 && `${result.analytics.fileAnalyticsUpdated} files analyzed`,
            result.analytics.suggestionFeedbackCreated && 'Feedback recorded'
          ].filter(Boolean).join(', ');
          
          if (analyticsMsg) {
            toast.success(`Analytics: ${analyticsMsg}`, { duration: 3000 });
          }
        }
        
        setShowFeedback(false);
        refetch();
      },
      onError: (error) => {
        console.error('Failed to save response:', error);
        toast.error('Failed to save response: ' + (error?.message || 'Unknown error'));
      }
    });
  };

  const handleQuickSave = () => {
    handleSaveWithFeedback();
  };

  if (!response || !project) {
    return null;
  }

  const hasGeneratedCode = !!(response.metadata?.generatedCode);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <Button 
          disabled={saveAnswer.isPending} 
          variant="outline" 
          size="sm"
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={() => setShowFeedback(!showFeedback)}
        >
          <Save className="h-4 w-4 mr-1" />
          {showFeedback ? 'Cancel' : 'Save with Feedback'}
        </Button>

        {/* Quick save without feedback */}
        {!showFeedback && (
          <Button 
            disabled={saveAnswer.isPending} 
            variant="ghost" 
            size="sm"
            className="text-white/60 hover:text-white"
            onClick={handleQuickSave}
            title="Save without feedback"
          >
            Quick Save
          </Button>
        )}

        {showFeedback && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white/60 hover:text-white"
            onClick={() => setShowFeedback(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Feedback Collector */}
      {showFeedback && (
        <FeedbackCollector
          onFeedback={handleSaveWithFeedback}
          hasGeneratedCode={hasGeneratedCode}
          isLoading={saveAnswer.isPending}
        />
      )}
    </div>
  );
};