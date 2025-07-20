import { db } from "@/server/db";
import { GitHubClient } from "./github-client";
import { PatternDetector } from "./pattern-detector";
import type { CodebaseStructure, StructureAnalysis } from "./types";
import type { Prisma } from "@prisma/client";

interface GitTreeItem {
  path: string;
  type: string;
  sha: string;
  size?: number;
  url?: string;
  mode?: string;
}

export class StructureAnalyzer {
  private githubClient: GitHubClient;
  private patternDetector: PatternDetector;

  constructor(githubToken?: string) {
    this.githubClient = new GitHubClient(githubToken);
    this.patternDetector = new PatternDetector();
  }

  async analyzeCodebaseStructure(projectId: string, githubUrl: string): Promise<CodebaseStructure> {
    console.log(`Analyzing codebase structure for project ${projectId}`);

    const { owner, repo } = this.githubClient.parseGithubUrl(githubUrl);
    
    try {
      // Get repository structure
      const languages = await this.githubClient.getRepositoryLanguages(owner, repo);
      const tree = await this.githubClient.getRepositoryTree(owner, repo);

      // Analyze structure
      const structure = this.analyzeProjectStructure(tree);
      
      // Store analysis results
      await this.storeAnalysisResults(projectId, languages.data, structure, tree);

      return structure;
    } catch (error) {
      console.error(`Error analyzing codebase structure:`, error);
      throw error;
    }
  }

  async identifyKeyFiles(projectId: string, githubUrl: string): Promise<StructureAnalysis> {
    const structure = await this.analyzeCodebaseStructure(projectId, githubUrl);
    
    // Identify important files for prioritized indexing
    const keyFiles = [
      // Configuration files
      ...structure.configFiles,
      // Main entry points
      ...structure.entryPoints,
      // Core business logic files
      ...structure.coreFiles,
      // API endpoints
      ...structure.apiFiles,
      // Database schemas
      ...structure.schemaFiles
    ];

    return {
      keyFiles: [...new Set(keyFiles)], // Remove duplicates
      structure
    };
  }

  private analyzeProjectStructure(tree: GitTreeItem[]): CodebaseStructure {
    const structure: CodebaseStructure = {
      configFiles: [],
      entryPoints: [],
      coreFiles: [],
      apiFiles: [],
      schemaFiles: [],
      testFiles: [],
      documentationFiles: [],
      framework: this.patternDetector.detectFramework(tree.map(item => item.path))
    };

    tree.forEach(item => {
      if (item.type !== 'blob') return;

      const path = item.path;
      
      // Configuration files
      if (this.patternDetector.isConfigFile(path)) {
        structure.configFiles.push(path);
      }
      
      // Entry points
      if (this.patternDetector.isEntryPoint(path)) {
        structure.entryPoints.push(path);
      }
      
      // API files
      if (this.patternDetector.isApiFile(path)) {
        structure.apiFiles.push(path);
      }
      
      // Schema files
      if (this.patternDetector.isSchemaFile(path)) {
        structure.schemaFiles.push(path);
      }
      
      // Test files
      if (this.patternDetector.isTestFile(path)) {
        structure.testFiles.push(path);
      }
      
      // Documentation
      if (this.patternDetector.isDocumentationFile(path)) {
        structure.documentationFiles.push(path);
      }
      
      // Core business logic (heuristic)
      if (this.patternDetector.isCoreFile(path, structure.framework)) {
        structure.coreFiles.push(path);
      }
    });

    return structure;
  }

  private async storeAnalysisResults(
    projectId: string, 
    languages: Record<string, number>, 
    structure: CodebaseStructure, 
    tree: GitTreeItem[]
  ): Promise<void> {
    const existingLogs = await this.getExistingLogs(projectId);
    
    await db.project.update({
      where: { id: projectId },
      data: {
        processingLogs: {
          ...existingLogs,
          codebaseAnalysis: {
            languages,
            structure: JSON.parse(JSON.stringify(structure)),
            lastAnalyzed: new Date().toISOString(),
            totalFiles: tree.filter(item => item.type === 'blob').length,
            directories: tree.filter(item => item.type === 'tree').length
          }
        } as Prisma.InputJsonValue
      }
    });
  }

  private async getExistingLogs(projectId: string): Promise<Record<string, unknown>> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { processingLogs: true }
    });

    return (project?.processingLogs as Record<string, unknown>) || {};
  }
}