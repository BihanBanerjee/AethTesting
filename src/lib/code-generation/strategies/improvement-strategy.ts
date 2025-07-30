// src/lib/code-generation/strategies/improvement-strategy.ts
import type { CodeGenerationRequest, CodeGenerationResult, ProjectContext, GenerationStrategy } from "../types";
import { PromptBuilder } from "../prompt-builder";
import { ResponseParser } from "../response-parser";
import { ProjectContextAnalyzer } from "../context-analyzer";
import { geminiModel, CONTEXT_LIMITS } from "../model-config";

export class ImprovementStrategy implements GenerationStrategy {
  private promptBuilder = new PromptBuilder();
  private responseParser = new ResponseParser();
  private contextAnalyzer = new ProjectContextAnalyzer();

  async generateCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    const targetFile = request.targetFile || request.contextFiles?.[0];
    if (!targetFile) {
      throw new Error('No target file specified for code improvement');
    }

    const fileContent = await this.contextAnalyzer.getFileContent(targetFile, request.projectId);
    
    // Log file size for monitoring (much larger files now supported)
    console.log(`📄 Processing file: ${fileContent.length} characters`);
    if (fileContent.length > CONTEXT_LIMITS.LARGE_FILE) {
      console.log(`📈 Large file detected (${fileContent.length} chars) - using enhanced context window`);
    }
    
    const prompt = this.promptBuilder.buildImprovementPrompt(request, context, fileContent);
    
    // Debug: Log prompt details 
    console.log(`📝 Final prompt length: ${prompt.length} characters`);
    console.log(`📄 Original file content length: ${fileContent.length} characters`);
    console.log(`🎯 Prompt starts with:`, prompt.substring(0, 300) + '...');
    console.log(`🎯 Prompt ends with:`, '...' + prompt.substring(prompt.length - 300));
    
    // Check if file was truncated in prompt building
    const wasTruncated = prompt.includes('[... content truncated for processing ...]') || 
                        prompt.includes('... (middle section truncated for processing) ...');
    console.log(`✂️ File was truncated in prompt: ${wasTruncated}`);
    
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} for AI generation`);
        console.log(`🤖 Using model config: maxOutputTokens=32768, temperature=0.1`);
        
        const result = await geminiModel.generateContent([prompt]);
        const response = result.response.text();
        
        // Check if the API response was truncated
        const finishReason = result.response.candidates?.[0]?.finishReason;
        const usageMetadata = result.response.usageMetadata;
        
        console.log('🔍 API Response Analysis:');
        console.log('  - Finish Reason:', finishReason);
        console.log('  - Usage Metadata:', usageMetadata);
        
        if (finishReason === 'MAX_TOKENS') {
          console.log('🚨 API TRUNCATED RESPONSE - Hit max token limit!');
        } else if (finishReason === 'STOP') {
          console.log('✅ API completed response normally');
        } else {
          console.log('⚠️ Unexpected finish reason:', finishReason);
        }
        
        // Log detailed response information
        console.log(`📏 AI response length: ${response.length} characters`);
        console.log(`🔍 Response starts with: "${response.substring(0, 150)}..."`);
        console.log(`🔍 Response ends with: "...${response.substring(response.length - 150)}"`);
        
        // Check if response looks complete
        const looksComplete = response.includes('```json') && response.includes('```') && response.trim().endsWith('```');
        const startsWithJson = response.trim().startsWith('```json');
        const hasContent = response.length > 100;
        
        console.log(`✅ Response appears complete: ${looksComplete}`);
        console.log(`📋 Starts with \`\`\`json: ${startsWithJson}`);
        console.log(`📊 Has substantial content: ${hasContent}`);
        
        // Log the actual JSON content if found
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          console.log(`🎯 Extracted JSON preview:`, jsonMatch[1].substring(0, 300) + '...');
          
          // NEW: Check if the extracted JSON itself has issues
          const jsonContent = jsonMatch[1];
          console.log(`🔍 JSON content length: ${jsonContent.length} characters`);
          
          // Look for problematic patterns that break JSON
          const problemPatterns = [
            { name: 'Unescaped quotes', pattern: /[^\\]"[^,}\]]/g },
            { name: 'Unescaped newlines', pattern: /[^\\]\n/g },
            { name: 'Unescaped backslashes', pattern: /[^\\]\\[^\\nrt"]/g }
          ];
          
          problemPatterns.forEach(({ name, pattern }) => {
            const matches = [...jsonContent.matchAll(pattern)];
            if (matches.length > 0) {
              console.log(`⚠️ Found ${matches.length} instances of ${name}:`);
              matches.slice(0, 3).forEach((match, i) => {
                const pos = match.index!;
                const context = jsonContent.substring(Math.max(0, pos - 50), pos + 50);
                console.log(`  ${i + 1}. Position ${pos}: "${context}"`);
              });
            }
          });
        } else {
          console.log(`❌ No JSON found in response - this is the problem!`);
          console.log(`🔍 Full response for debugging:`, response);
        }
        
        // Try to parse the response
        const parsed = this.responseParser.parseCodeGenerationResponse(response, context, request);
        
        // Check if we got a malformed response
        if (parsed.explanation?.includes('Generated code (extracted from malformed response)') && attempts < maxAttempts) {
          console.log(`⚠️ Attempt ${attempts} returned malformed response, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
          continue;
        }
        
        console.log(`✅ Attempt ${attempts} succeeded`);
        return parsed;
        
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error);
        if (attempts === maxAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
    
    // This should never be reached, but just in case
    throw new Error('All retry attempts failed');
  }
}