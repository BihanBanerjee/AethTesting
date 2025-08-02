// src/lib/code-generation/strategies/explain-strategy.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CodeGenerationRequest, CodeGenerationResult, ProjectContext, GenerationStrategy } from "../types";
import { PromptBuilder } from "../prompt-builder";
import { ResponseParser } from "../response-parser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export class ExplainStrategy implements GenerationStrategy {
  private promptBuilder = new PromptBuilder();
  private responseParser = new ResponseParser();

  async generateCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    // Extract detail level from request
    const detailLevel = this.extractDetailLevel(request.query);
    
    const prompt = this.promptBuilder.buildExplainPrompt(request, context, detailLevel);
    
    try {
      const result = await model.generateContent([prompt]);
      const response = result.response.text();
      
      if (!response) {
        throw new Error('Empty response from AI model');
      }
      
      // Parse the explanation response which has a different structure
      return this.parseExplanationResponse(response, context);
    } catch (error) {
      console.error('Code explanation failed:', error);
      throw new Error(`Code explanation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract detail level from user query
   */
  private extractDetailLevel(query: string): 'brief' | 'detailed' | 'comprehensive' {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('brief') || lowerQuery.includes('quick') || lowerQuery.includes('summary')) {
      return 'brief';
    }
    
    if (lowerQuery.includes('comprehensive') || lowerQuery.includes('in-depth') || lowerQuery.includes('detailed')) {
      return 'comprehensive';
    }
    
    return 'detailed'; // Default
  }

  /**
   * Parse explanation response which has a different structure than code generation
   */
  private parseExplanationResponse(response: string, context: ProjectContext): CodeGenerationResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON found in explanation response');
      }
      
      const explanationData = JSON.parse(jsonMatch[1]);
      
      // Transform explanation data to CodeGenerationResult format
      return {
        type: 'code_snippet',
        files: [],
        explanation: this.formatExplanation(explanationData),
        warnings: this.formatExplanationWarnings(explanationData),
        dependencies: explanationData.dependencies || []
      };
      
    } catch (parseError) {
      console.error('Failed to parse explanation response:', parseError);
      
      // Fallback: use the original response parser
      try {
        return this.responseParser.parseCodeGenerationResponse(response, context);
      } catch (fallbackError) {
        // Final fallback: return basic result
        return {
          type: 'code_snippet',
          files: [],
          explanation: 'Code explanation completed, but response parsing failed',
          warnings: ['Response format was not recognized'],
          dependencies: []
        };
      }
    }
  }

  /**
   * Format explanation data into a cohesive explanation
   */
  private formatExplanation(explanationData: any): string {
    let explanation = explanationData.explanation || 'Code explanation:';
    
    // Add key points if available
    if (explanationData.keyPoints && Array.isArray(explanationData.keyPoints)) {
      explanation += '\n\n**Key Points:**\n';
      explanation += explanationData.keyPoints.map((point: string, index: number) => 
        `${index + 1}. ${point}`
      ).join('\n');
    }
    
    // Add code flow if available
    if (explanationData.codeFlow && Array.isArray(explanationData.codeFlow)) {
      explanation += '\n\n**Code Flow:**\n';
      explanation += explanationData.codeFlow.map((step: string, index: number) => 
        `${index + 1}. ${step}`
      ).join('\n');
    }
    
    // Add patterns if available
    if (explanationData.patterns && Array.isArray(explanationData.patterns)) {
      explanation += '\n\n**Design Patterns & Techniques:**\n';
      explanation += explanationData.patterns.map((pattern: string) => 
        `• ${pattern}`
      ).join('\n');
    }
    
    // Add recommendations if available
    if (explanationData.recommendations && Array.isArray(explanationData.recommendations)) {
      explanation += '\n\n**Recommendations:**\n';
      explanation += explanationData.recommendations.map((rec: string) => 
        `• ${rec}`
      ).join('\n');
    }
    
    return explanation;
  }

  /**
   * Format explanation data as warnings (for consistency with other strategies)
   */
  private formatExplanationWarnings(explanationData: any): string[] {
    const warnings: string[] = [];
    
    // Add key points as informational warnings
    if (explanationData.keyPoints && Array.isArray(explanationData.keyPoints)) {
      warnings.push(...explanationData.keyPoints.map((point: string) => 
        `Key Point: ${point}`
      ));
    }
    
    // Add recommendations as actionable warnings
    if (explanationData.recommendations && Array.isArray(explanationData.recommendations)) {
      warnings.push(...explanationData.recommendations.map((rec: string) => 
        `Recommendation: ${rec}`
      ));
    }
    
    // Add any direct warnings
    if (explanationData.warnings && Array.isArray(explanationData.warnings)) {
      warnings.push(...explanationData.warnings);
    }
    
    return warnings;
  }
}