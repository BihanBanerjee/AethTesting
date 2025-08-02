// src/lib/code-generation/engine.ts
import type { CodeGenerationRequest, CodeGenerationResult } from "./types";
import { ProjectContextAnalyzer } from "./context-analyzer";
import { NewCodeStrategy } from "./strategies/new-code-strategy";
import { ImprovementStrategy } from "./strategies/improvement-strategy";
import { RefactorStrategy } from "./strategies/refactor-strategy";
import { DebugStrategy } from "./strategies/debug-strategy";
import { ReviewStrategy } from "./strategies/review-strategy";
import { ExplainStrategy } from "./strategies/explain-strategy";

export class CodeGenerationEngine {
  private contextAnalyzer = new ProjectContextAnalyzer();
  private strategies = {
    code_generation: new NewCodeStrategy(),
    code_improvement: new ImprovementStrategy(),
    refactor: new RefactorStrategy(),
    debug: new DebugStrategy(),
    code_review: new ReviewStrategy(),
    explain: new ExplainStrategy()
  };

  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const { intent, projectId } = request;
    
    // Get project context
    const projectContext = await this.contextAnalyzer.getProjectContext(
      projectId, 
      intent.contextNeeded, 
      request.contextFiles
    );
    
    // Select appropriate strategy
    const strategy = this.strategies[intent.type as keyof typeof this.strategies];
    if (!strategy) {
      throw new Error(`Unsupported intent type: ${intent.type}`);
    }

    // Generate code using the selected strategy
    return await strategy.generateCode(request, projectContext);
  }
}