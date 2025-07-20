// src/lib/code-generation/strategies/improvement-strategy.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CodeGenerationRequest, CodeGenerationResult, ProjectContext, GenerationStrategy } from "../types";
import { PromptBuilder } from "../prompt-builder";
import { ResponseParser } from "../response-parser";
import { ProjectContextAnalyzer } from "../context-analyzer";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
    const prompt = this.promptBuilder.buildImprovementPrompt(request, context, fileContent);
    
    try {
      const result = await model.generateContent([prompt]);
      const response = result.response.text();
      
      return this.responseParser.parseCodeGenerationResponse(response, context);
    } catch (error) {
      console.error('Code improvement failed:', error);
      throw new Error(`Code improvement failed: ${error.message}`);
    }
  }
}