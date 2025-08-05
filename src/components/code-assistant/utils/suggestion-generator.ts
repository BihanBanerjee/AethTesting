import type { SuggestionPrediction, ProjectContext } from '../types/smart-input-suggestion.types';
import type { QueryIntent } from '@/lib/intent-classifier';
import { INTENT_ICONS } from '../constants/suggestion-icons';

export function generateSuggestions(
  input: string, 
  intent: QueryIntent, 
  context?: ProjectContext
): SuggestionPrediction[] {
  const suggestions: SuggestionPrediction[] = [];
  
  // Intent-specific suggestions
  switch (intent.type) {
    case 'code_generation':
      suggestions.push({
        suggestion: `${input} with TypeScript and proper error handling`,
        intent: 'Enhanced Generation',
        confidence: intent.confidence,
        icon: INTENT_ICONS.code_generation
      });
      
      if (context?.techStack?.includes('React')) {
        suggestions.push({
          suggestion: `${input} as a React component with hooks`,
          intent: 'React Component',
          confidence: intent.confidence * 0.9,
          icon: INTENT_ICONS.code_generation
        });
      }
      break;
      
    case 'debug':
      suggestions.push({
        suggestion: `${input} and provide step-by-step debugging guide`,
        intent: 'Debug Guide',
        confidence: intent.confidence,
        icon: INTENT_ICONS.debug
      });
      
      suggestions.push({
        suggestion: `${input} and suggest testing strategies to prevent this`,
        intent: 'Debug + Prevention',
        confidence: intent.confidence * 0.8,
        icon: INTENT_ICONS.debug
      });
      break;
      
    case 'code_improvement':
      suggestions.push({
        suggestion: `${input} and explain the performance impact`,
        intent: 'Performance Analysis',
        confidence: intent.confidence,
        icon: INTENT_ICONS.code_improvement
      });
      
      suggestions.push({
        suggestion: `${input} following SOLID principles`,
        intent: 'SOLID Refactor',
        confidence: intent.confidence * 0.9,
        icon: INTENT_ICONS.code_improvement
      });
      break;
      
    case 'code_review':
      suggestions.push({
        suggestion: `${input} with security vulnerability assessment`,
        intent: 'Security Review',
        confidence: intent.confidence,
        icon: INTENT_ICONS.code_review
      });
      break;
      
    case 'refactor':
      suggestions.push({
        suggestion: `${input} while maintaining backward compatibility`,
        intent: 'Safe Refactor',
        confidence: intent.confidence,
        icon: INTENT_ICONS.refactor
      });
      break;
      
    case 'explain':
      suggestions.push({
        suggestion: `${input} with visual diagrams and examples`,
        intent: 'Visual Explanation',
        confidence: intent.confidence,
        icon: INTENT_ICONS.explain
      });
      break;
  }
  
  // Add file-specific suggestions if files are detected
  if (intent.targetFiles && intent.targetFiles.length > 0) {
    suggestions.push({
      suggestion: `${input} specifically for ${intent.targetFiles[0]}`,
      intent: 'File-Specific',
      confidence: intent.confidence * 0.95,
      icon: INTENT_ICONS.file_specific
    });
  }
  
  return suggestions.slice(0, 3); // Limit to top 3 suggestions
}