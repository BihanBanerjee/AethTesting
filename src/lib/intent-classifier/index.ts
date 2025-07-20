import { AIClassifier } from "./ai-classifier";
import { FallbackClassifier } from "./fallback-classifier";
import { FileAnalyzer } from "./file-analyzer";
import type { QueryIntent, ClassificationContext } from "./types";

export class IntentClassifier {
  private aiClassifier: AIClassifier;
  private fallbackClassifier: FallbackClassifier;
  private fileAnalyzer: FileAnalyzer;

  constructor() {
    this.aiClassifier = new AIClassifier();
    this.fallbackClassifier = new FallbackClassifier();
    this.fileAnalyzer = new FileAnalyzer();
  }
  
  async classifyQuery(query: string, projectContext?: unknown): Promise<QueryIntent> {
    // Check if AI classification is available
    if (!this.aiClassifier.isAvailable()) {
      console.warn('Gemini API key not configured, using fallback classification');
      return this.fallbackClassifier.classifyQuery(query);
    }

    try {
      const context: ClassificationContext = { projectContext };
      return await this.aiClassifier.classifyQuery(query, context);
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
export { AIClassifier } from "./ai-classifier";
export { FallbackClassifier } from "./fallback-classifier";
export { FileAnalyzer } from "./file-analyzer";