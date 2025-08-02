import { AIClassifier } from "./ai-classifier";
import { FallbackClassifier } from "./fallback-classifier";
import { FileAnalyzer } from "./file-analyzer";
import type { QueryIntent } from "./types";

export class IntentClassifier {
  private aiClassifier: AIClassifier;
  private fallbackClassifier: FallbackClassifier;
  private fileAnalyzer: FileAnalyzer;

  constructor() {
    this.aiClassifier = new AIClassifier();
    this.fallbackClassifier = new FallbackClassifier();
    this.fileAnalyzer = new FileAnalyzer();
  }
  
  async classifyQuery(query: string): Promise<QueryIntent> {
    // Check if AI classification is available
    if (!this.aiClassifier.isAvailable()) {
      // Only warn on server-side, be quiet on client-side
      if (typeof window === 'undefined') {
        console.warn('Gemini API key not configured, using fallback classification');
      }
      return this.fallbackClassifier.classifyQuery(query);
    }

    try {
      return await this.aiClassifier.classifyQuery(query);
    } catch (error) {
      console.error('Intent classification failed:', error);
      // Always fallback to keyword-based classification
      return this.fallbackClassifier.classifyQuery(query);
    }
  }

  // Enhanced context detection
  extractFileReferences(query: string, availableFiles: string[]): string[] {
    return this.fileAnalyzer.extractFileReferences(query, availableFiles);
  }
}

// Export types and components
export type { QueryIntent, ClassificationContext } from "./types";
export type { 
  IntentBasedInput,
  QuestionInput,
  CodeGenerationInput,
  CodeImprovementInput,
  CodeReviewInput,
  DebugInput,
  RefactorInput,
  ExplainInput,
  ExtractIntentInput
} from "./input-types";
export { 
  isQuestionInput,
  isCodeGenerationInput,
  isCodeImprovementInput,
  isCodeReviewInput,
  isDebugInput,
  isRefactorInput,
  isExplainInput
} from "./input-types";
export { AIClassifier } from "./ai-classifier";
export { FallbackClassifier } from "./fallback-classifier";
export { FileAnalyzer } from "./file-analyzer";