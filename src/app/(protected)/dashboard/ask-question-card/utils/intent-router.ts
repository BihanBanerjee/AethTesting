// src/app/(protected)/dashboard/ask-question-card/utils/intent-router.ts
import type { EnhancedResponse, ApiMutations } from '../types/enhanced-response';
import type { IntentType } from '../../actions/types/action-types';

export function extractSimpleContent(result: any): string {
  if (typeof result === 'string') return result;
  
  // Handle unified response format first (prioritize actual content over explanations)
  if (result.content && typeof result.content === 'string') {
    return convertLiteralNewlines(result.content);
  }
  if (result.files && Array.isArray(result.files) && result.files[0]?.content) {
    return convertLiteralNewlines(result.files[0].content);
  }
  if (result.generatedCode) {
    return convertLiteralNewlines(String(result.generatedCode));
  }
  
  // Legacy format fallbacks
  if (result.improvedCode) return convertLiteralNewlines(String(result.improvedCode));  
  if (result.answer) return convertLiteralNewlines(String(result.answer));
  if (result.response) return convertLiteralNewlines(String(result.response));
  if (result.summary) return convertLiteralNewlines(String(result.summary));
  if (result.diagnosis) return convertLiteralNewlines(String(result.diagnosis));
  if (result.explanation) return convertLiteralNewlines(String(result.explanation));
  
  return JSON.stringify(result, null, 2);
}

// Helper function to convert literal \n characters to actual newlines
function convertLiteralNewlines(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

function generateCodeSummary(result: any, question: string): string {
  // Extract key information from the question to understand what was requested
  const questionLower = question.toLowerCase();
  
  // Determine component/feature type from the question
  let componentType = 'component';
  if (questionLower.includes('authentication') || questionLower.includes('auth')) {
    componentType = 'authentication component';
  } else if (questionLower.includes('form') && questionLower.includes('validation')) {
    componentType = 'form with validation';
  } else if (questionLower.includes('modal') || questionLower.includes('dialog')) {
    componentType = 'modal component';
  } else if (questionLower.includes('navbar') || questionLower.includes('navigation')) {
    componentType = 'navigation component';
  } else if (questionLower.includes('dashboard')) {
    componentType = 'dashboard component';
  } else if (questionLower.includes('table') || questionLower.includes('data')) {
    componentType = 'data table component';
  } else if (questionLower.includes('button')) {
    componentType = 'button component';
  } else if (questionLower.includes('hook')) {
    componentType = 'custom hook';
  } else if (questionLower.includes('util') || questionLower.includes('helper')) {
    componentType = 'utility function';
  }

  // Extract technology/framework information
  const technologies: string[] = [];
  if (questionLower.includes('typescript')) technologies.push('TypeScript');
  if (questionLower.includes('react')) technologies.push('React');
  if (questionLower.includes('next')) technologies.push('Next.js');
  if (questionLower.includes('tailwind')) technologies.push('Tailwind CSS');
  if (questionLower.includes('form validation') || questionLower.includes('zod')) technologies.push('form validation');
  if (questionLower.includes('error handling')) technologies.push('error handling');

  // Get language from result or default to TypeScript
  const language = result.language || 'TypeScript';
  const languageLabel = language === 'typescript' ? 'TypeScript' : language === 'javascript' ? 'JavaScript' : language;

  // Build descriptive summary
  let summary = `${languageLabel} ${componentType}`;
  
  if (technologies.length > 0) {
    summary += ` with ${technologies.join(', ')}`;
  }

  // Add additional context from the result if available
  if (result.files && result.files.length > 0 && result.files[0].path) {
    const fileName = result.files[0].path;
    if (fileName.includes('.component.') || fileName.includes('Component')) {
      summary += ` (${fileName})`;
    }
  }

  return summary;
}

export async function routeIntentToHandler(
  intent: any,
  question: string,
  projectId: string,
  selectedFiles: string[],
  mutations: ApiMutations
): Promise<EnhancedResponse> {
  
  // All requests now go through the unified askQuestion mutation
  // The wrapper mutations in useApiMutations handle the intent-specific parameters
  let result: any;
  
  switch (intent.type as IntentType) {
    case 'code_generation':
      result = await mutations.generateCode.mutateAsync({
        intent: 'code_generation',
        projectId,
        prompt: question,
        context: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
        requirements: {
          framework: 'react',
          language: 'typescript'
        }
      });

      return transformToEnhancedResponse(result, intent, question, 'code');

    case 'code_improvement':
      result = await mutations.improveCode.mutateAsync({
        intent: 'code_improvement',
        projectId,
        suggestions: question,
        targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
        improvementType: 'optimization'
      });

      return transformToEnhancedResponse(result, intent, question, 'code');

    case 'code_review':
      result = await mutations.reviewCode.mutateAsync({
        intent: 'code_review',
        projectId,
        files: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [],
        reviewType: 'comprehensive',
        focusAreas: question
      });

      return transformToEnhancedResponse(result, intent, question, 'review');

    case 'debug':
      result = await mutations.debugCode.mutateAsync({
        intent: 'debug',
        projectId,
        errorDescription: question,
        suspectedFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles
      });

      return transformToEnhancedResponse(result, intent, question, 'debug');

    case 'refactor':
      // Add refactor case that was missing
      result = await mutations.askQuestion.mutateAsync({
        projectId,
        query: question,
        contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
        intent: 'refactor',
        refactoringGoals: question,
        preserveAPI: true
      });

      return transformToEnhancedResponse(result, intent, question, 'code');

    case 'explain':
      // Add explain case that was missing
      result = await mutations.askQuestion.mutateAsync({
        projectId,
        query: question,
        contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
        intent: 'explain',
        detailLevel: 'detailed'
      });

      return transformToEnhancedResponse(result, intent, question, 'answer');

    case 'question':
    default:
      // Fallback to regular Q&A
      result = await mutations.askQuestion.mutateAsync({
        projectId,
        query: question,
        contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
        intent: intent.type || 'question'
      });

      const content = await processStreamableValue(result);

      return {
        type: 'answer',
        content,
        intent,
        filesReferences: result.filesReferences || []
      };
  }
}

// Helper function to transform unified responses to Enhanced Response Format
function transformToEnhancedResponse(
  result: any, 
  intent: any, 
  question: string, 
  responseType: 'code' | 'review' | 'debug' | 'answer'
): EnhancedResponse {
  // CRITICAL: Preserve existing Enhanced Response Format transformation
  // This ensures the 📑 Response | 💻 Code | 📁 Files UI continues to work
  
  if (responseType === 'code' && (result.files && result.files.length > 0 || result.generatedCode || result.improvedCode)) {
    const actualCode = result.generatedCode || result.improvedCode || result.files?.[0]?.content;
    const actualLanguage = result.files?.[0]?.language || result.language || 'ts';
    const actualFileName = result.files?.[0]?.path || `${intent.type}-${Date.now()}.${actualLanguage}`;

    return {
      type: 'code',
      content: extractSimpleContent(result),
      intent,
      metadata: {
        generatedCode: actualCode,
        language: actualLanguage,
        warnings: result.warnings,
        dependencies: result.dependencies,
        files: result.files?.map((f: any) => f.path) || [],
        diff: result.diff,
        suggestions: result.suggestions
      },
      filesReferences: actualCode ? [{
        fileName: actualFileName,
        sourceCode: convertLiteralNewlines(actualCode),
        summary: generateCodeSummary(result, question)
      }] : []
    };
  }

  if (responseType === 'review') {
    return {
      type: 'review',
      content: extractSimpleContent(result),
      intent,
      metadata: {
        issues: result.issues,
        suggestions: result.suggestions,
        files: result.filesReviewed
      }
    };
  }

  if (responseType === 'debug') {
    return {
      type: 'debug',
      content: extractSimpleContent(result),
      intent,
      metadata: {
        suggestions: result.suggestions,
        files: result.suspectedFiles
      }
    };
  }

  // Default answer format
  return {
    type: 'answer',
    content: result.answer || extractSimpleContent(result),
    intent,
    filesReferences: result.filesReferences || []
  };
}

async function processStreamableValue(qaResult: any): Promise<string> {
  if (!qaResult.answer) {
    return 'No response available';
  }

  if (typeof qaResult.answer === 'string') {
    return qaResult.answer;
  }

  if (typeof qaResult.answer === 'object') {
    try {
      return await new Promise<string>((resolve) => {
        let accumulated = '';
        let attempts = 0;
        const maxAttempts = 100;
        
        const readStream = () => {
          attempts++;
          
          if (qaResult.answer && typeof qaResult.answer === 'object') {
            const currentValue = qaResult.answer.value;
            
            if (currentValue !== undefined) {
              if (typeof currentValue === 'string') {
                accumulated = currentValue;
              } else if (typeof currentValue === 'object') {
                if (currentValue.curr !== undefined) {
                  accumulated += String(currentValue.curr);
                }
                if (currentValue.next !== undefined && currentValue.next !== null) {
                  accumulated += String(currentValue.next);
                }
                
                if (accumulated.length > 0) {
                  resolve(accumulated);
                  return;
                }
              }
            }
          }
          
          if (accumulated.length > 0) {
            resolve(accumulated);
            return;
          }
          
          if (attempts < maxAttempts) {
            setTimeout(readStream, 100);
          } else {
            resolve(accumulated || 'Response processing timed out');
          }
        };
        
        readStream();
      });
    } catch (error) {
      console.error('Error processing StreamableValue:', error);
      return 'Error processing AI response';
    }
  }

  return String(qaResult.answer);
}