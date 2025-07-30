import type { QueryIntent } from '@/lib/intent-classifier';

export function createFallbackIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();
  
  console.log('🎯 Using enhanced fallback classification for:', query.substring(0, 30) + '...');
  
  // Enhanced code generation patterns
  if (matchesPatterns(lowerQuery, [
    'create', 'generate', 'write', 'build', 'implement', 'add new',
    'make a', 'develop', 'code for', 'function that', 'component that',
    'scaffold', 'boilerplate', 'template', 'new file', 'starter'
  ])) {
    return {
      type: 'code_generation',
      confidence: 0.8,
      requiresCodeGen: true,
      requiresFileModification: true,
      contextNeeded: 'project',
      targetFiles: []
    };
  }

  // Enhanced code improvement patterns (especially for README/docs)
  if (matchesPatterns(lowerQuery, [
    'improve', 'optimize', 'enhance', 'better', 'performance',
    'make faster', 'more efficient', 'cleaner', 'simplify',
    'update', 'modernize', 'readme', 'documentation', 'docs'
  ])) {
    return {
      type: 'code_improvement',
      confidence: 0.8,
      requiresCodeGen: true,
      requiresFileModification: true,
      contextNeeded: 'file',
      targetFiles: []
    };
  }

  // Refactor patterns
  if (matchesPatterns(lowerQuery, [
    'refactor', 'restructure', 'reorganize', 'move', 'extract',
    'rename', 'split', 'combine', 'merge'
  ])) {
    return {
      type: 'refactor',
      confidence: 0.8,
      requiresCodeGen: true,
      requiresFileModification: true,
      contextNeeded: 'function',
      targetFiles: []
    };
  }

  // Debug patterns
  if (matchesPatterns(lowerQuery, [
    'bug', 'error', 'fix', 'issue', 'problem', 'not working',
    'broken', 'debug', 'troubleshoot'
  ])) {
    return {
      type: 'debug',
      confidence: 0.9,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'file',
      targetFiles: []
    };
  }

  // Review patterns
  if (matchesPatterns(lowerQuery, [
    'review', 'check', 'validate', 'audit', 'security',
    'best practices', 'code quality'
  ])) {
    return {
      type: 'code_review',
      confidence: 0.8,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'file',
      targetFiles: []
    };
  }

  // Explain patterns
  if (matchesPatterns(lowerQuery, [
    'explain', 'how does', 'what is', 'understand', 'clarify',
    'walk through', 'breakdown'
  ])) {
    return {
      type: 'explain',
      confidence: 0.9,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'function',
      targetFiles: []
    };
  }

  // Default to question
  return {
    type: 'question',
    confidence: 0.7,
    requiresCodeGen: false,
    requiresFileModification: false,
    contextNeeded: 'project',
    targetFiles: []
  };
}

function matchesPatterns(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Enhanced matching: check for whole words to reduce false positives
    const regex = new RegExp(`\\b${pattern.replace(/\s+/g, '\\s+')}\\b`, 'i');
    return regex.test(text) || text.includes(pattern);
  });
}