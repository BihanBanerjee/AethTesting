// src/lib/code-generation/response-parser.ts
import type { CodeGenerationResult, GeneratedFile, ProjectContext, CodeGenerationRequest } from "./types";

interface ParsedFile {
  path: string;
  content: string;
  language?: string;
  changeType?: string;
  diff?: string;
  insertionPoint?: number;
}
import { extractJSON, lightCleanJSON, repairUnterminatedJSON, cleanCodeContent } from "./utils/code-utils";
import { detectLanguage } from "./utils/language-utils";

export class ResponseParser {
  parseCodeGenerationResponse(response: string, context: ProjectContext, request?: CodeGenerationRequest): CodeGenerationResult {
    try {
      console.log('🔍 Raw AI Response:', response.substring(0, 200) + '...');
      
      // NEW: Try streaming extraction first - more reliable for partial responses
      const streamingResult = this.tryStreamingExtraction(response, request);
      if (streamingResult) {
        console.log('✅ Successfully used streaming extraction');
        return streamingResult;
      }
      
      // FALLBACK: Traditional JSON parsing
      let jsonStr = extractJSON(response);
      
      if (!jsonStr) {
        throw new Error('No valid JSON found in AI response');
      }

      console.log('📝 Extracted JSON:', jsonStr.substring(0, 200) + '...');
      
      // Try to parse directly first
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (firstError) {
        console.log('❌ First parse failed:', firstError instanceof Error ? firstError.message : 'Unknown error');
        console.log('🔍 JSON that failed to parse (first 500 chars):', jsonStr.substring(0, 500));
        
        // Extract position from error message if available
        const errorMsg = firstError instanceof Error ? firstError.message : '';
        const positionMatch = errorMsg.match(/position (\d+)/);
        if (positionMatch && positionMatch[1]) {
          const errorPosition = parseInt(positionMatch[1]);
          const contextStart = Math.max(0, errorPosition - 100);
          const contextEnd = Math.min(jsonStr.length, errorPosition + 100);
          const errorContext = jsonStr.substring(contextStart, contextEnd);
          const relativePos = errorPosition - contextStart;
          
          console.log(`🔍 Error context around position ${errorPosition}:`);
          console.log(`"${errorContext}"`);
          console.log(`${' '.repeat(relativePos)}^--- Error here`);
          console.log('🔍 Full response length vs error position:', jsonStr.length, 'vs', errorPosition);
        }
        
        console.log('❌ First parse failed, trying light cleaning...');
        
        // Only do minimal, safe cleaning
        jsonStr = lightCleanJSON(jsonStr);
        console.log('🧹 Light cleaned JSON:', jsonStr.substring(0, 200) + '...');
        
        try {
          parsed = JSON.parse(jsonStr);
        } catch (secondError) {
          console.log('❌ Second parse failed:', secondError instanceof Error ? secondError.message : 'Unknown error');
          console.log('🔍 Light cleaned JSON that failed (first 500 chars):', jsonStr.substring(0, 500));
          
          // If it's an "unterminated string" error, try to repair it
          if (secondError instanceof Error && secondError.message.includes('Unterminated string')) {
            console.log('🔧 Detected unterminated string, attempting repair...');
            try {
              const repairedJSON = repairUnterminatedJSON(jsonStr);
              parsed = JSON.parse(repairedJSON);
              console.log('✅ Successfully parsed repaired JSON');
              console.log('🔍 Repaired JSON structure:', {
                type: parsed.type,
                filesCount: parsed.files?.length,
                firstFilePath: parsed.files?.[0]?.path,
                firstFileKeys: parsed.files?.[0] ? Object.keys(parsed.files[0]) : []
              });
            } catch (repairError) {
              console.log('❌ JSON repair also failed:', repairError instanceof Error ? repairError.message : 'Unknown error');
              console.log('❌ Falling back to content extraction');
              return this.extractCodeFromResponse(response);
            }
          } else {
            console.log('❌ Second parse failed, trying content extraction...');
            // Last resort: extract just the content if it's a code generation
            return this.extractCodeFromResponse(response);
          }
        }
      }
      
      // Validate the response structure
      if (!parsed.type || !parsed.files || !Array.isArray(parsed.files)) {
        throw new Error('Invalid response structure from AI');
      }

      // Process each file and clean any remaining issues
      const processedFiles: GeneratedFile[] = parsed.files.map((file: ParsedFile, index: number) => {
        // Try to infer the correct path from context if missing
        let filePath = file.path;
        if (!filePath) {
          // For code improvement, try to use the target file from request
          const targetFile = request?.targetFile || request?.contextFiles?.[0];
          if (targetFile) {
            filePath = targetFile;
          } else {
            filePath = `generated-file-${index + 1}.txt`;
          }
          console.log(`⚠️ Missing file path, using fallback: ${filePath}`);
        }
        
        return {
          path: filePath,
          content: cleanCodeContent(file.content),
          language: file.language || detectLanguage(filePath),
          changeType: file.changeType || 'create',
          diff: file.diff,
          insertionPoint: file.insertionPoint
        };
      });

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
      console.error('Full response length:', response.length);
      console.error('Response starts with:', response.substring(0, 200));
      console.error('Response ends with:', response.substring(Math.max(0, response.length - 200)));
      console.error('Looking for ```json pattern:', response.includes('```json'));
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

  private tryStreamingExtraction(response: string, request?: CodeGenerationRequest): CodeGenerationResult | null {
    console.log('🔄 Attempting streaming extraction...');
    
    // Look for content between quotes after "content": 
    const contentMatch = response.match(/"content":\s*"([\s\S]*?)(?="[,\s]*(?:"language"|"changeType"|$))/);
    if (!contentMatch) {
      console.log('❌ No content field found for streaming extraction');
      return null;
    }
    
    let content = contentMatch[1];
    console.log(`🔍 Found content field: ${content.length} characters`);
    
    // Clean up escaped characters (reverse what the AI escaped)
    content = content
      .replace(/\\n/g, '\n')      // Convert \\n back to newlines
      .replace(/\\r/g, '\r')      // Convert \\r back to carriage returns  
      .replace(/\\t/g, '\t')      // Convert \\t back to tabs
      .replace(/\\"/g, '"')       // Convert \\" back to quotes
      .replace(/\\\\/g, '\\');    // Convert \\\\ back to single backslash
    
    // Extract other fields if available
    const languageMatch = response.match(/"language":\s*"([^"]+)"/);
    const language = languageMatch?.[1] || 'markdown';
    
    const explanationMatch = response.match(/"explanation":\s*"([^"]+?)"/);
    const explanation = explanationMatch?.[1] || 'Content extracted via streaming parser';
    
    // Determine file path
    const targetFile = request?.targetFile || request?.contextFiles?.[0] || 'README.md';
    
    // Check if content looks substantial
    if (content.length < 100) {
      console.log('⚠️ Content too short for streaming extraction');
      return null;
    }
    
    console.log(`✅ Streaming extraction successful: ${content.length} chars, language: ${language}`);
    
    return {
      type: 'file_modification',
      files: [{
        path: targetFile,
        content: content,
        language: language,
        changeType: 'modify'
      }],
      explanation: explanation,
      warnings: ['Content extracted via streaming parser due to JSON parsing issues'],
      dependencies: []
    };
  }

  private createSmartFallbackResponse(response: string, context: ProjectContext): CodeGenerationResult {
    console.log('🚨 Creating smart fallback response');
    console.log('Response preview:', response.substring(0, 200) + '...');
    
    // Check if this looks like a partial JSON response (starts with content, not JSON structure)
    if (response.includes('"language"') && response.includes('"explanation"')) {
      console.log('🔧 Detected partial JSON response, attempting reconstruction');
      
      // Try to extract the actual content from what looks like a middle-truncated JSON response
      const contentMatch = response.match(/^([^"]*?)(?=",\s*"language")/s);
      if (contentMatch && contentMatch[1]) {
        let extractedContent = contentMatch[1].trim();
        
        // Remove escape characters and clean up
        extractedContent = extractedContent.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        
        // Check if this looks like it's only a partial/tail end of content
        if (extractedContent.length < 200 || extractedContent.startsWith('\n\n') || extractedContent.includes('## Contributing')) {
          console.log('⚠️ Detected incomplete content (likely tail end), creating user-friendly message');
          
          // Extract language if available
          const languageMatch = response.match(/"language":\s*"([^"]+)"/);
          const language = languageMatch?.[1] || 'text';
          
          // Extract explanation if available for user feedback
          const explanationMatch = response.match(/"explanation":\s*"([^"]+?)"/s);
          const explanation = explanationMatch?.[1] ? explanationMatch[1].replace(/\\n/g, '\n') : '';
          
          return {
            type: 'file_modification',
            files: [{
              path: 'README.md',
              content: `# AI Response Incomplete\n\nThe AI response was truncated and only shows the end of the content:\n\n---\n\n${extractedContent}\n\n---\n\n**Note:** This appears to be only a partial response. Please try asking again for the complete improved README.\n\n${explanation ? `**What the AI intended to do:**\n${explanation}` : ''}`,
              language: language,
              changeType: 'modify' as const
            }],
            explanation: 'AI response was truncated - only partial content recovered',
            warnings: ['Response was truncated - please try again for complete content'],
            dependencies: []
          };
        }
        
        // Extract language if available
        const languageMatch = response.match(/"language":\s*"([^"]+)"/);
        const language = languageMatch?.[1] || 'text';
        
        // Extract explanation if available
        const explanationMatch = response.match(/"explanation":\s*"([^"]+?)"/s);
        const explanation = explanationMatch?.[1] ? explanationMatch[1].replace(/\\n/g, '\n') : 'Code extracted from partial response';
        
        console.log('✅ Successfully extracted content from partial JSON');
        return {
          type: 'file_modification',
          files: [{
            path: 'extracted-content',
            content: extractedContent,
            language: language,
            changeType: 'modify' as const
          }],
          explanation: explanation,
          warnings: ['Response was partially truncated but content was recovered'],
          dependencies: []
        };
      }
    }
    
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