// src/lib/code-generation/response-parser.ts
import type { CodeGenerationResult, GeneratedFile, ProjectContext } from "./types";

interface ParsedFile {
  path: string;
  content: string;
  language?: string;
  changeType?: string;
  diff?: string;
  insertionPoint?: number;
}
import { extractJSON, lightCleanJSON, cleanCodeContent } from "./utils/code-utils";
import { detectLanguage } from "./utils/language-utils";

export class ResponseParser {
  parseCodeGenerationResponse(response: string, context: ProjectContext): CodeGenerationResult {
    try {
      console.log('🔍 Raw AI Response:', response.substring(0, 200) + '...');
      
      // SIMPLIFIED: Just extract JSON without aggressive cleaning
      let jsonStr = extractJSON(response);
      
      if (!jsonStr) {
        throw new Error('No valid JSON found in AI response');
      }

      console.log('📝 Extracted JSON:', jsonStr.substring(0, 200) + '...');
      
      // Try to parse directly first
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (firstError) {
        console.log('❌ First parse failed, trying light cleaning...');
        
        // Only do minimal, safe cleaning
        jsonStr = lightCleanJSON(jsonStr);
        console.log('🧹 Light cleaned JSON:', jsonStr.substring(0, 200) + '...');
        
        try {
          parsed = JSON.parse(jsonStr);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (secondError) {
          console.log('❌ Second parse failed, trying content extraction...');
          
          // Last resort: extract just the content if it's a code generation
          return this.extractCodeFromResponse(response);
        }
      }
      
      // Validate the response structure
      if (!parsed.type || !parsed.files || !Array.isArray(parsed.files)) {
        throw new Error('Invalid response structure from AI');
      }

      // Process each file and clean any remaining issues
      const processedFiles: GeneratedFile[] = parsed.files.map((file: ParsedFile) => ({
        path: file.path,
        content: cleanCodeContent(file.content),
        language: file.language || detectLanguage(file.path),
        changeType: file.changeType || 'create',
        diff: file.diff,
        insertionPoint: file.insertionPoint
      }));

      console.log('✅ Successfully parsed AI response');
      return {
        type: parsed.type,
        files: processedFiles,
        explanation: parsed.explanation || 'Code generated successfully',
        warnings: parsed.warnings || [],
        dependencies: parsed.dependencies || []
      };

    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.error('Response was:', response.substring(0, 500) + '...');
      
      // Enhanced fallback: try to extract useful content
      return this.createSmartFallbackResponse(response, context);
    }
  }

  private extractCodeFromResponse(response: string): CodeGenerationResult {
    console.log('🔧 Extracting code from response as fallback');
    
    // Find all code blocks
    const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
    
    let extractedCode = '';
    let language = 'text';  // Changed from 'typescript' to 'text' as more neutral default
    let explanation = 'Generated code (extracted from malformed response)';
    
    // Look for the largest code block that isn't JSON
    for (const block of codeBlocks) {
      const content = block.replace(/```\w*\n?/, '').replace(/\n?```$/, '').trim();
      
      // Skip if it looks like JSON
      if (content.startsWith('{') && content.includes('"type"')) {
        continue;
      }
      
      // Use the first non-JSON code block
      if (content.length > extractedCode.length) {
        extractedCode = content;
        
        // Try to detect language
        const langMatch = block.match(/```(\w+)/);
        if (langMatch && langMatch[1] !== 'json') {
          language = langMatch?.[1] ?? 'typescript';
        }
      }
    }
    
    // If no code blocks found, try to extract from the full response
    if (!extractedCode) {
      // Look for import statements or function definitions
      const importMatch = response.match(/import[\s\S]*?from[\s\S]*?;/);
      if (importMatch) {
        // Try to find a logical end point
        const lines = response.split('\n');
        let startIndex = -1;
        let endIndex = lines.length;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]?.includes('import') && startIndex === -1) {
            startIndex = i;
          }
          if (lines[i]?.includes('export') && startIndex !== -1) {
            endIndex = i + 10; // Include a few more lines after export
            break;
          }
        }
        
        if (startIndex !== -1) {
          extractedCode = lines.slice(startIndex, endIndex).join('\n');
        }
      }
    }
    
    // Final fallback
    if (!extractedCode) {
      extractedCode = '// Unable to extract code from AI response\n// Please try again or rephrase your request';
      explanation = 'Failed to parse AI response - please try again';
    }
    
    return {
      type: 'code_snippet',
      files: [{
        path: `generated-code.${language === 'typescript' ? 'ts' : language === 'jsx' ? 'jsx' : 'js'}`,
        content: extractedCode,
        language,
        changeType: 'create'
      }],
      explanation,
      warnings: ['Response parsing failed - extracted code may be incomplete'],
      dependencies: []
    };
  }

  private createSmartFallbackResponse(response: string, context: ProjectContext): CodeGenerationResult {
    console.log('🚨 Creating smart fallback response');
    
    // Try the code extraction first
    const extracted = this.extractCodeFromResponse(response);
    
    // If we got meaningful code, return it
    if ((extracted.files?.[0]?.content?.length ?? 0) > 50 && !(extracted.files?.[0]?.content?.includes('Unable to extract') ?? false)) {
      return extracted;
    }
    
    // Otherwise, create a helpful error response with context-aware suggestions
    const techStackSuggestions = context.techStack.length > 0 
      ? `\n## Your project uses:
${context.techStack.map(tech => `- ${tech}`).join('\n')}

Consider asking for code specific to these technologies.`
      : '';

    const architectureSuggestion = context.architecturePattern 
      ? `\n## Your project follows ${context.architecturePattern} architecture
Try asking for code that follows this pattern.`
      : '';

    return {
      type: 'code_snippet',
      files: [{
        path: 'error-response.md',
        content: `# AI Response Processing Error

The AI generated a response, but it couldn't be parsed properly.

## What happened:
- The AI response contained malformed JSON
- Automatic extraction failed
- This is likely due to the AI including special characters in the response

## What you can do:
1. Try rephrasing your request more specifically
2. Ask for simpler code generation tasks
3. Specify the exact file type and structure you want${techStackSuggestions}${architectureSuggestion}

## Partial AI Response:
\`\`\`
${response.substring(0, 500)}${response.length > 500 ? '...' : ''}
\`\`\`

Please try again with a more specific request.`,
        language: 'markdown',
        changeType: 'create'
      }],
      explanation: 'AI response parsing failed - see the generated file for details and suggestions',
      warnings: [
        'Response parsing failed due to malformed JSON',
        'Try rephrasing your request more specifically',
        'Consider asking for simpler code generation tasks'
      ],
      dependencies: []
    };
  }
}