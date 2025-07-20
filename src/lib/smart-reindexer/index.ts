import { FileProcessor } from "./file-processor";
import { StructureAnalyzer } from "./structure-analyzer";
import { GitHubClient } from "./github-client";
import { PatternDetector } from "./pattern-detector";
import type { 
  ReindexingResult, 
  CodebaseStructure, 
  StructureAnalysis 
} from "./types";

export class SmartReindexer {
  private fileProcessor: FileProcessor;
  private structureAnalyzer: StructureAnalyzer;
  private githubClient: GitHubClient;
  private patternDetector: PatternDetector;

  constructor(githubToken?: string) {
    this.fileProcessor = new FileProcessor(githubToken);
    this.structureAnalyzer = new StructureAnalyzer(githubToken);
    this.githubClient = new GitHubClient(githubToken);
    this.patternDetector = new PatternDetector();
  }

  async reindexChangedFiles(
    projectId: string, 
    githubUrl: string, 
    changedFiles: string[],
    githubToken?: string
  ): Promise<ReindexingResult[]> {
    // Use provided token or fall back to the instance's file processor
    const processor = githubToken ? new FileProcessor(githubToken) : this.fileProcessor;
    return processor.reindexChangedFiles(projectId, githubUrl, changedFiles);
  }

  async analyzeCodebaseStructure(projectId: string, githubUrl: string): Promise<CodebaseStructure> {
    return this.structureAnalyzer.analyzeCodebaseStructure(projectId, githubUrl);
  }

  async identifyKeyFiles(projectId: string, githubUrl: string): Promise<StructureAnalysis> {
    return this.structureAnalyzer.identifyKeyFiles(projectId, githubUrl);
  }

  // Utility methods that delegate to the appropriate components
  parseGithubUrl(githubUrl: string): { owner: string; repo: string } {
    return this.githubClient.parseGithubUrl(githubUrl);
  }

  async checkFileExists(owner: string, repo: string, path: string): Promise<boolean> {
    return this.githubClient.checkFileExists(owner, repo, path);
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    return this.githubClient.getFileContent(owner, repo, path);
  }

  detectFramework(files: string[]): string {
    return this.patternDetector.detectFramework(files);
  }

  isConfigFile(path: string): boolean {
    return this.patternDetector.isConfigFile(path);
  }

  isEntryPoint(path: string): boolean {
    return this.patternDetector.isEntryPoint(path);
  }

  isApiFile(path: string): boolean {
    return this.patternDetector.isApiFile(path);
  }

  isSchemaFile(path: string): boolean {
    return this.patternDetector.isSchemaFile(path);
  }

  isTestFile(path: string): boolean {
    return this.patternDetector.isTestFile(path);
  }

  isDocumentationFile(path: string): boolean {
    return this.patternDetector.isDocumentationFile(path);
  }

  isCoreFile(path: string, framework: string): boolean {
    return this.patternDetector.isCoreFile(path, framework);
  }
}

// Export types and components for direct use
export type { 
  FileChange, 
  ReindexingResult, 
  CodebaseStructure, 
  StructureAnalysis,
  AnalysisResult 
} from "./types";

export { FileProcessor } from "./file-processor";
export { StructureAnalyzer } from "./structure-analyzer";
export { GitHubClient } from "./github-client";
export { PatternDetector } from "./pattern-detector";