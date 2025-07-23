// src/app/(protected)/dashboard/ask-question-card/utils/intent-router.ts
import type { EnhancedResponse, IntentType, ApiMutations } from '../types/enhanced-response';

export function extractSimpleContent(result: any): string {
  if (typeof result === 'string') return result;
  if (result.explanation) return String(result.explanation);
  if (result.summary) return String(result.summary);
  if (result.diagnosis) return String(result.diagnosis);
  if (result.answer) return String(result.answer);
  if (result.response) return String(result.response);
  return JSON.stringify(result, null, 2);
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
  let result: any;
  
  switch (intent.type as IntentType) {
    case 'code_generation':
      result = await mutations.generateCode.mutateAsync({
        projectId,
        prompt: question,
        context: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
        requirements: {
          framework: 'react',
          language: 'typescript'
        }
      });

      return {
        type: 'code',
        content: extractSimpleContent(result),
        intent,
        metadata: {
          generatedCode: result.generatedCode,
          language: result.language,
          warnings: result.warnings,
          dependencies: result.dependencies,
          files: result.files?.map((f: any) => f.path) || []
        },
        filesReferences: result.generatedCode ? [{
          fileName: result.files?.[0]?.path || `generated-${intent.type}.${result.language === 'typescript' ? 'ts' : 'js'}`,
          sourceCode: result.generatedCode,
          summary: generateCodeSummary(result, question)
        }] : []
      };

    case 'code_improvement':
      result = await mutations.improveCode.mutateAsync({
        projectId,
        suggestions: question,
        targetFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
        improvementType: 'optimization'
      });

      return {
        type: 'code',
        content: extractSimpleContent(result),
        intent,
        metadata: {
          generatedCode: result.improvedCode,
          diff: result.diff,
          suggestions: result.suggestions
        },
        filesReferences: result.improvedCode ? [{
          fileName: `improved-${intent.targetFiles?.[0] || 'code'}.${result.language || 'ts'}`,
          sourceCode: result.improvedCode,
          summary: generateCodeSummary(result, question).replace(/component|function/, 'improved $&')
        }] : []
      };

    case 'code_review':
      result = await mutations.reviewCode.mutateAsync({
        projectId,
        files: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [],
        reviewType: 'comprehensive',
        focusAreas: question
      });

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

    case 'debug':
      result = await mutations.debugCode.mutateAsync({
        projectId,
        errorDescription: question,
        contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles
      });

      return {
        type: 'debug',
        content: extractSimpleContent(result),
        intent,
        metadata: {
          suggestions: result.suggestions,
          files: result.suspectedFiles
        }
      };

    default:
      // Fallback to regular Q&A
      const qaResult = await mutations.askQuestion.mutateAsync({
        projectId,
        query: question,
        contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles
      });

      const content = await processStreamableValue(qaResult);

      return {
        type: 'answer',
        content,
        intent,
        filesReferences: qaResult.filesReferences || []
      };
  }
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