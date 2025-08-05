import type { QueryIntent } from "./types";
import { FileAnalyzer } from "./file-analyzer";

export class FallbackClassifier {
  private fileAnalyzer: FileAnalyzer;

  constructor() {
    this.fileAnalyzer = new FileAnalyzer();
  }

  classifyQuery(query: string, availableFiles: string[] = []): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    // Only log on server-side, be quiet on client-side for input suggestions
    if (typeof window === 'undefined') {
      console.log('🔄 Using fallback intent classification for:', query.substring(0, 50) + '...');
    }
    
    // Enhanced code generation patterns
    if (this.matchesPatterns(lowerQuery, [
      'create', 'generate', 'write', 'build', 'implement', 'add new',
      'make a', 'develop', 'code for', 'function that', 'component that',
      'scaffold', 'boilerplate', 'template', 'new file', 'starter'
    ])) {
      if (typeof window === 'undefined') {
        console.log('✅ Classified as: code_generation (fallback)');
      }
      return {
        type: 'code_generation',
        confidence: 0.8,
        requiresCodeGen: true,
        requiresFileModification: true,
        contextNeeded: 'project',
        targetFiles: this.fileAnalyzer.extractFileReferences(query, availableFiles)
      };
    }

    // Enhanced code improvement patterns
    if (this.matchesPatterns(lowerQuery, [
      'improve', 'optimize', 'enhance', 'better', 'performance',
      'make faster', 'more efficient', 'cleaner', 'simplify',
      'update', 'modernize', 'readme', 'documentation', 'docs'
    ])) {
      if (typeof window === 'undefined') {
        console.log('✅ Classified as: code_improvement (fallback)');
      }
      return {
        type: 'code_improvement',
        confidence: 0.8,
        requiresCodeGen: true,
        requiresFileModification: true,
        contextNeeded: 'file',
        targetFiles: this.fileAnalyzer.extractFileReferences(query, availableFiles)
      };
    }

    // Refactor patterns
    if (this.matchesPatterns(lowerQuery, [
      'refactor', 'restructure', 'reorganize', 'move', 'extract',
      'rename', 'split', 'combine', 'merge'
    ])) {
      console.log('✅ Classified as: refactor (fallback)');
      return {
        type: 'refactor',
        confidence: 0.8,
        requiresCodeGen: true,
        requiresFileModification: true,
        contextNeeded: 'function',
        targetFiles: this.fileAnalyzer.extractFileReferences(query, availableFiles)
      };
    }

    // Debug patterns
    if (this.matchesPatterns(lowerQuery, [
      'bug', 'error', 'fix', 'issue', 'problem', 'not working',
      'broken', 'debug', 'troubleshoot'
    ])) {
      console.log('✅ Classified as: debug (fallback)');
      return {
        type: 'debug',
        confidence: 0.9,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'file',
        targetFiles: this.fileAnalyzer.extractFileReferences(query, availableFiles)
      };
    }

    // Review patterns
    if (this.matchesPatterns(lowerQuery, [
      'review', 'check', 'validate', 'audit', 'security',
      'best practices', 'code quality'
    ])) {
      console.log('✅ Classified as: code_review (fallback)');
      return {
        type: 'code_review',
        confidence: 0.8,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'file',
        targetFiles: this.fileAnalyzer.extractFileReferences(query, availableFiles)
      };
    }

    // Explain patterns
    if (this.matchesPatterns(lowerQuery, [
      'explain', 'how does', 'what is', 'understand', 'clarify',
      'walk through', 'breakdown'
    ])) {
      console.log('✅ Classified as: explain (fallback)');
      return {
        type: 'explain',
        confidence: 0.9,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'function',
        targetFiles: this.fileAnalyzer.extractFileReferences(query, availableFiles)
      };
    }

    // Default to question
    if (typeof window === 'undefined') {
      console.log('✅ Classified as: question (fallback default)');
    }
    return {
      type: 'question',
      confidence: 0.7,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'project',
      targetFiles: this.fileAnalyzer.extractFileReferences(query, availableFiles)
    };
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // Enhanced matching: check for whole words to reduce false positives
      const regex = new RegExp(`\\b${pattern.replace(/\s+/g, '\\s+')}\\b`, 'i');
      return regex.test(text) || text.includes(pattern);
    });
  }
}

// Export function interface for compatibility with existing code
export function createFallbackIntent(query: string): QueryIntent {
  const classifier = new FallbackClassifier();
  return classifier.classifyQuery(query);
}