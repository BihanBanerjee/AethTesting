// src/lib/code-generation/context-analyzer.ts
import { db } from "@/server/db";
import type { ProjectContext } from "./types";
import { 
  inferTechStack, 
  inferArchitecturePattern, 
  inferCodingStandards 
} from "./utils/language-utils";
import { 
  inferFileType, 
  extractExports, 
  extractImports, 
  buildProjectStructure 
} from "./utils/file-utils";

export class ProjectContextAnalyzer {
  async getProjectContext(projectId: string, contextLevel: string, targetFiles?: string[]): Promise<ProjectContext> {
    // Get relevant embeddings based on context level
    let relevantFiles: any[] = [];
    
    if (targetFiles && targetFiles.length > 0) {
      // Get specific files
      relevantFiles = await db.sourceCodeEmbedding.findMany({
        where: {
          projectId,
          fileName: { in: targetFiles }
        }
      });
    } else {
      // Get broader context based on level
      const limit = contextLevel === 'global' ? 50 : contextLevel === 'project' ? 20 : 10;
      relevantFiles = await db.sourceCodeEmbedding.findMany({
        where: { projectId },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Analyze project structure and patterns
    const techStack = inferTechStack(relevantFiles);
    const architecturePattern = inferArchitecturePattern(relevantFiles);
    const codingStandards = inferCodingStandards(relevantFiles);
    const projectStructure = buildProjectStructure(relevantFiles);

    return {
      relevantFiles: relevantFiles.map(f => ({
        fileName: f.fileName,
        summary: f.summary,
        sourceCode: f.sourceCode,
        type: inferFileType(f.fileName),
        exports: extractExports(f.sourceCode),
        imports: extractImports(f.sourceCode)
      })),
      techStack,
      architecturePattern,
      codingStandards,
      projectStructure
    };
  }

  async getFileContent(fileName: string, projectId: string): Promise<string> {
    const file = await db.sourceCodeEmbedding.findFirst({
      where: {
        projectId,
        fileName
      }
    });

    if (!file) {
      throw new Error(`File not found: ${fileName}`);
    }

    try {
      const parsed = JSON.parse(file.sourceCode);
      return typeof parsed === 'string' ? parsed : parsed.content || '';
    } catch {
      return file.sourceCode;
    }
  }
}