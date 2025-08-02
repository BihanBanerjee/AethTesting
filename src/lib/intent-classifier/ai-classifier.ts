import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { QueryIntent } from "./types";

export class AIClassifier {
  private model: GenerativeModel | null = null;

  constructor() {
    // Don't access environment variables in constructor to avoid client-side errors
    // Model will be initialized when needed
  }

  isAvailable(): boolean {
    // Only check environment variables server-side
    return typeof window === 'undefined' && Boolean(process.env.GEMINI_API_KEY);
  }
  
  private initializeModel(): void {
    if (!this.model && typeof window === 'undefined' && process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }

  async classifyQuery(query: string): Promise<QueryIntent> {
    this.initializeModel();
    
    if (!this.isAvailable() || !this.model) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = this.buildPrompt(query);
      const result = await this.model.generateContent([prompt]);
      const response = result.response.text();
      
      return this.parseResponse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private buildPrompt(query: string): string {
    return `
      Analyze this user query and classify the intent. Consider the context of a software development project.

      Query: "${query}"

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
  }

  /*
  reasoning is NOT used:
  - Only appears in the AI prompt template
  - AI generates it but the codebase doesn't consume it
  - It's dead data - just for human debugging if you inspect the response
  */

  private parseResponse(response: string): QueryIntent {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    // this regex approach handles both clean JSON and chatty AI responses (extra text around JSON).
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
    /*
    Pattern: This is defensive programming - don't trust external data (even from AI), always validate
    and normalize it to match your expected types.
    */
  }

  private handleError(error: unknown): void {
    // Enhanced error handling for different error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      console.warn('🚨 Gemini API is temporarily overloaded. Using fallback classification.');
      console.warn('💡 This is normal during high traffic periods. The fallback will work fine!');
    } else if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
      console.error('🔑 Gemini API key is invalid or missing. Please check your environment variables.');
      console.error('Make sure GEMINI_API_KEY is set in your .env file');
    } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      console.warn('📈 API quota exceeded. Using fallback classification.');
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNRESET')) {
      console.warn('🌐 Network error connecting to Gemini API. Using fallback classification.');
    } else {
      console.error('❌ Unexpected error during intent classification:', errorMessage);
    }
  }
}