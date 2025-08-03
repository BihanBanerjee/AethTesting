// src/lib/code-generation/engine.ts
import type { CodeGenerationRequest, CodeGenerationResult } from "./types";
import { performVectorSearch } from "@/app/(protected)/dashboard/actions/database/vector-search";
import { buildIntentAwarePrompt } from "@/app/(protected)/dashboard/actions/prompts/intent-prompts";
import { google, MODEL_CONFIG } from "@/app/(protected)/dashboard/actions/config/ai-config";
import { getSearchConfig } from "@/app/(protected)/dashboard/actions/config/search-config";
import { generateText } from 'ai';

export class CodeGenerationEngine {
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const { intent, projectId, query, contextFiles } = request;
    
    try {
      // Get search configuration for the intent
      const searchConfig = getSearchConfig(intent.type);
      
      // Perform vector search to get relevant code context
      const relevantFiles = await performVectorSearch(
        query,
        projectId,
        {
          similarityThreshold: searchConfig.similarityThreshold,
          resultLimit: searchConfig.resultLimit,
        }
      );

      // Build context string from search results
      const context = relevantFiles
        .map(file => `### ${file.fileName}\n${file.summary}\n\`\`\`\n${file.sourceCode}\n\`\`\``)
        .join('\n\n');

      // Build intent-aware prompt
      const prompt = buildIntentAwarePrompt(intent.type, query, context);

      // Generate response using AI
      const { text } = await generateText({
        model: google(MODEL_CONFIG.CODE_GENERATION),
        prompt,
      });

      // Parse and format the response
      return this.parseCodeGenerationResponse(text, intent.type, relevantFiles);
      
    } catch (error) {
      console.error('[CodeGenerationEngine] Error:', error);
      throw error;
    }
  }

  private parseCodeGenerationResponse(
    content: string, 
    intentType: string, 
    relevantFiles: any[]
  ): CodeGenerationResult {
    // Simple response parser - extracts code blocks and explanations
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = Array.from(content.matchAll(codeBlockRegex));
    
    const files = matches.map((match, index) => ({
      path: `generated_file_${index + 1}.${this.getFileExtension(match[1] || 'typescript')}`,
      content: match[2]?.trim() || '',
      language: match[1] || 'typescript',
      changeType: 'create' as const
    }));

    // Extract explanation (everything outside code blocks)
    let explanation = content.replace(codeBlockRegex, '').trim();
    
    // Clean up extra whitespace
    explanation = explanation.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    return {
      type: files.length > 1 ? 'multiple_files' : files.length === 1 ? 'new_file' : 'code_snippet',
      files,
      explanation: explanation || 'Code generated successfully',
      warnings: [],
      dependencies: this.extractDependencies(content)
    };
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      tsx: 'tsx',
      jsx: 'jsx',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c'
    };
    return extensions[language.toLowerCase()] || 'txt';
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract npm packages from import statements
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(content.matchAll(importRegex));
    
    matches.forEach(match => {
      const packageName = match[1];
      // Only include external packages (not relative imports)
      if (packageName && !packageName.startsWith('.') && !packageName.startsWith('/')) {
        dependencies.push(packageName);
      }
    });

    return Array.from(new Set(dependencies)); // Remove duplicates
  }
}