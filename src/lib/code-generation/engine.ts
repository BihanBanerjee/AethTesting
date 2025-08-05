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

    // Extract explanation (everything outside code blocks) - moved up to fix variable scope
    let explanation = content.replace(codeBlockRegex, '').trim();

    // SMART HANDLING: For ALL intents, detect and fix fragmented markdown files
    if (matches.length > 1) {
      const isMarkdownBlocks = matches.every(match => 
        !match[1] || match[1].toLowerCase() === 'markdown' || match[1].toLowerCase() === 'md'
      );
      
      if (isMarkdownBlocks) {
        // Conservative detection: only combine if we detect clear fragmentation patterns
        const hasFragmentationPatterns = matches.some(match => {
          const content = match[2]?.trim() || '';
          return content.startsWith('2. **') ||     // Step continuation
                 content.startsWith('3. **') ||     // Step continuation
                 content.startsWith('4. **') ||     // Step continuation
                 content.startsWith('5. **') ||     // Step continuation
                 content.startsWith('6. **') ||     // Step continuation
                 content.length < 100 ||            // Very short blocks
                 (!content.includes('# ') && content.length > 0); // No main headers but has content
        });
        
        if (hasFragmentationPatterns) {
          const combinedContent = matches.map(match => match[2]?.trim() || '').join('\n\n');
          
          // Determine appropriate filename based on intent and content
          let filename = 'generated_document.md';
          let successMessage = 'Markdown document generated successfully';
          
          if (intentType === 'code_improvement' || combinedContent.toLowerCase().includes('readme')) {
            filename = 'README.md';
            successMessage = 'README file improved successfully';
          } else if (combinedContent.toLowerCase().includes('contributing')) {
            filename = 'CONTRIBUTING.md';
            successMessage = 'Contributing guide generated successfully';
          } else if (combinedContent.toLowerCase().includes('license')) {
            filename = 'LICENSE.md';
            successMessage = 'License file generated successfully';
          } else if (intentType === 'debug') {
            filename = 'TROUBLESHOOTING.md';
            successMessage = 'Troubleshooting guide generated successfully';
          }
          
          return {
            type: 'new_file' as const,
            files: [{
              path: filename,
              content: combinedContent,
              language: 'markdown',
              changeType: 'create' as const
            }],
            explanation: explanation || successMessage,
            warnings: [],
            dependencies: this.extractDependencies(content)
          };
        }
        // If no fragmentation patterns detected, continue with normal multi-file processing
      }
    }
    
    // Clean up extra whitespace
    explanation = explanation.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    return {
      type: files.length > 1 ? 'multiple_files' as const : files.length === 1 ? 'new_file' as const : 'code_snippet' as const,
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