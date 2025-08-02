// src/lib/code-generation/strategies/review-strategy.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CodeGenerationRequest, CodeGenerationResult, ProjectContext, GenerationStrategy } from "../types";
import { PromptBuilder } from "../prompt-builder";
import { ResponseParser } from "../response-parser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export class ReviewStrategy implements GenerationStrategy {
  private promptBuilder = new PromptBuilder();
  private responseParser = new ResponseParser();

  async generateCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    // Extract review parameters from request
    const reviewType = this.extractReviewType(request.query);
    const focusAreas = this.extractFocusAreas(request.query);
    
    const prompt = this.promptBuilder.buildReviewPrompt(request, context, reviewType, focusAreas);
    
    try {
      const result = await model.generateContent([prompt]);
      const response = result.response.text();
      
      if (!response) {
        throw new Error('Empty response from AI model');
      }
      
      // Parse the review response which has a different structure
      return this.parseReviewResponse(response, context);
    } catch (error) {
      console.error('Code review failed:', error);
      throw new Error(`Code review failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract review type from user query
   */
  private extractReviewType(query: string): 'security' | 'performance' | 'comprehensive' {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('security') || lowerQuery.includes('vulnerable') || lowerQuery.includes('auth')) {
      return 'security';
    }
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('optimize') || lowerQuery.includes('speed')) {
      return 'performance';
    }
    
    return 'comprehensive';
  }

  /**
   * Extract focus areas from user query
   */
  private extractFocusAreas(query: string): string | undefined {
    // Look for patterns like "focus on X" or "pay attention to Y"
    const focusPatterns = [
      /focus on ([^.]+)/i,
      /pay attention to ([^.]+)/i,
      /especially ([^.]+)/i,
      /particularly ([^.]+)/i
    ];

    for (const pattern of focusPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Parse review response which has a different structure than code generation
   */
  private parseReviewResponse(response: string, context: ProjectContext): CodeGenerationResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON found in review response');
      }
      
      const reviewData = JSON.parse(jsonMatch[1]);
      
      // Transform review data to CodeGenerationResult format
      return {
        type: 'code_snippet',
        files: [],
        explanation: reviewData.summary || reviewData.explanation || 'Code review completed',
        warnings: this.formatReviewWarnings(reviewData),
        dependencies: []
      };
      
    } catch (parseError) {
      console.error('Failed to parse review response:', parseError);
      
      // Fallback: use the original response parser
      try {
        return this.responseParser.parseCodeGenerationResponse(response, context);
      } catch (fallbackError) {
        // Final fallback: return basic result
        return {
          type: 'code_snippet',
          files: [],
          explanation: 'Code review completed, but response parsing failed',
          warnings: ['Response format was not recognized'],
          dependencies: []
        };
      }
    }
  }

  /**
   * Format review issues and suggestions as warnings
   */
  private formatReviewWarnings(reviewData: any): string[] {
    const warnings: string[] = [];
    
    // Add issues as warnings
    if (reviewData.issues && Array.isArray(reviewData.issues)) {
      warnings.push(...reviewData.issues.map((issue: any) => 
        `${issue.severity?.toUpperCase() || 'ISSUE'}: ${issue.description} (${issue.file || 'unknown file'})`
      ));
    }
    
    // Add suggestions as warnings
    if (reviewData.suggestions && Array.isArray(reviewData.suggestions)) {
      warnings.push(...reviewData.suggestions.map((suggestion: any) => 
        `SUGGESTION: ${suggestion.description}`
      ));
    }
    
    // Add any direct warnings
    if (reviewData.warnings && Array.isArray(reviewData.warnings)) {
      warnings.push(...reviewData.warnings);
    }
    
    return warnings;
  }
}