// src/lib/code-generation/strategies/new-code-strategy.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CodeGenerationRequest, CodeGenerationResult, ProjectContext, GenerationStrategy } from "../types";
import { PromptBuilder } from "../prompt-builder";
import { ResponseParser } from "../response-parser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export class NewCodeStrategy implements GenerationStrategy {
  private promptBuilder = new PromptBuilder();
  private responseParser = new ResponseParser();

  async generateCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    const prompt = this.promptBuilder.buildGenerationPrompt(request, context);
    
    try {
      const result = await model.generateContent([prompt]);
      const response = result.response.text();
      
      return this.responseParser.parseCodeGenerationResponse(response, context);
    } catch (error) {
      console.error('Code generation failed:', error);
      throw new Error(`Code generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}