// src/lib/intent-classifier.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface QueryIntent {
  type: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
  confidence: number;
  targetFiles?: string[];
  requiresCodeGen: boolean;
  requiresFileModification: boolean;
  contextNeeded: 'file' | 'function' | 'project' | 'global';
}

export class IntentClassifier {
  
  async classifyQuery(query: string, projectContext?: any): Promise<QueryIntent> {
    const prompt = `
      Analyze this user query and classify the intent. Consider the context of a software development project.

      Query: "${query}"

      Project Context: ${projectContext ? JSON.stringify(projectContext, null, 2) : 'No specific context'}

      Classify the intent as one of:
      1. question - User wants information about existing code
      2. code_generation - User wants new code to be written
      3. code_improvement - User wants existing code to be optimized or enhanced
      4. code_review - User wants code to be reviewed for issues
      5. refactor - User wants code structure to be changed while preserving functionality
      6. debug - User wants help fixing bugs or errors
      7. explain - User wants detailed explanation of how code works

      Respond with ONLY a JSON object in this format:
      {
        "type": "intent_type",
        "confidence": 0.85,
        "targetFiles": ["file1.ts", "file2.ts"],
        "requiresCodeGen": true,
        "requiresFileModification": false,
        "contextNeeded": "file|function|project|global",
        "reasoning": "Brief explanation of classification"
      }
    `;

    try {
      const result = await model.generateContent([prompt]);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and set defaults
      return {
        type: parsed.type || 'question',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        targetFiles: Array.isArray(parsed.targetFiles) ? parsed.targetFiles : [],
        requiresCodeGen: Boolean(parsed.requiresCodeGen),
        requiresFileModification: Boolean(parsed.requiresFileModification),
        contextNeeded: ['file', 'function', 'project', 'global'].includes(parsed.contextNeeded) 
          ? parsed.contextNeeded : 'project'
      };
      
    } catch (error) {
      console.error('Intent classification failed:', error);
      
      // Fallback classification based on keywords
      return this.fallbackClassification(query);
    }
  }

  private fallbackClassification(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    // Code generation patterns
    if (this.matchesPatterns(lowerQuery, [
      'create', 'generate', 'write', 'build', 'implement', 'add new',
      'make a', 'develop', 'code for', 'function that', 'component that'
    ])) {
      return {
        type: 'code_generation',
        confidence: 0.7,
        requiresCodeGen: true,
        requiresFileModification: true,
        contextNeeded: 'project'
      };
    }

    // Code improvement patterns
    if (this.matchesPatterns(lowerQuery, [
      'improve', 'optimize', 'enhance', 'better', 'performance',
      'make faster', 'more efficient', 'cleaner', 'simplify'
    ])) {
      return {
        type: 'code_improvement',
        confidence: 0.7,
        requiresCodeGen: true,
        requiresFileModification: true,
        contextNeeded: 'file'
      };
    }

    // Refactor patterns
    if (this.matchesPatterns(lowerQuery, [
      'refactor', 'restructure', 'reorganize', 'move', 'extract',
      'rename', 'split', 'combine', 'merge'
    ])) {
      return {
        type: 'refactor',
        confidence: 0.7,
        requiresCodeGen: true,
        requiresFileModification: true,
        contextNeeded: 'function'
      };
    }

    // Debug patterns
    if (this.matchesPatterns(lowerQuery, [
      'bug', 'error', 'fix', 'issue', 'problem', 'not working',
      'broken', 'debug', 'troubleshoot'
    ])) {
      return {
        type: 'debug',
        confidence: 0.8,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'file'
      };
    }

    // Review patterns
    if (this.matchesPatterns(lowerQuery, [
      'review', 'check', 'validate', 'audit', 'security',
      'best practices', 'code quality'
    ])) {
      return {
        type: 'code_review',
        confidence: 0.7,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'file'
      };
    }

    // Explain patterns
    if (this.matchesPatterns(lowerQuery, [
      'explain', 'how does', 'what is', 'understand', 'clarify',
      'walk through', 'breakdown'
    ])) {
      return {
        type: 'explain',
        confidence: 0.8,
        requiresCodeGen: false,
        requiresFileModification: false,
        contextNeeded: 'function'
      };
    }

    // Default to question
    return {
      type: 'question',
      confidence: 0.5,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'project'
    };
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  // Enhanced context detection
  extractFileReferences(query: string, availableFiles: string[]): string[] {
    const references: string[] = [];
    
    // Direct file mentions
    for (const file of availableFiles) {
      const fileName = file.split('/').pop() || file;
      if (query.toLowerCase().includes(fileName.toLowerCase())) {
        references.push(file);
      }
    }
    
    // Component/function name mentions
    const componentPattern = /\b[A-Z][a-zA-Z]*(?:Component|Page|Hook|Provider)?\b/g;
    const functionPattern = /\b[a-z][a-zA-Z]*(?:Function|Handler|Util)?\b/g;
    
    const components = query.match(componentPattern) || [];
    const functions = query.match(functionPattern) || [];
    
    // Find files that might contain these components/functions
    for (const name of [...components, ...functions]) {
      const matchingFiles = availableFiles.filter(file => 
        file.toLowerCase().includes(name.toLowerCase()) ||
        file.toLowerCase().includes(this.camelToKebab(name))
      );
      references.push(...matchingFiles);
    }
    
    return [...new Set(references)];
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}