// src/lib/smart-reindexer.ts
import { db } from "@/server/db";
import { loadGithubRepo } from "./github-loader";
import { summariseCode, generateEmbedding } from "./gemini";
import { Octokit } from "octokit";

interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'removed';
  content?: string;
}

export class SmartReindexer {
  private octokit: Octokit;

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken || process.env.GITHUB_TOKEN
    });
  }

  async reindexChangedFiles(
    projectId: string, 
    githubUrl: string, 
    changedFiles: string[],
    githubToken?: string
  ) {
    console.log(`Smart re-indexing ${changedFiles.length} files for project ${projectId}`);

    const { owner, repo } = this.parseGithubUrl(githubUrl);
    const results = [];

    for (const filePath of changedFiles) {
      try {
        // Check if file still exists (wasn't deleted)
        const fileExists = await this.checkFileExists(owner, repo, filePath);
        
        if (!fileExists) {
          // Remove from index if deleted
          await this.removeFileFromIndex(projectId, filePath);
          results.push({ filePath, status: 'removed' });
          continue;
        }

        // Get file content
        const fileContent = await this.getFileContent(owner, repo, filePath);
        
        if (!fileContent) {
          console.warn(`Could not fetch content for ${filePath}`);
          continue;
        }

        // Re-index the file
        await this.reindexSingleFile(projectId, filePath, fileContent);
        results.push({ filePath, status: 'reindexed' });

      } catch (error) {
        console.error(`Error re-indexing file ${filePath}:`, error);
        results.push({ filePath, status: 'error', error: error.message });
      }
    }

    console.log(`Re-indexing completed. Results:`, {
      reindexed: results.filter(r => r.status === 'reindexed').length,
      removed: results.filter(r => r.status === 'removed').length,
      errors: results.filter(r => r.status === 'error').length
    });

    return results;
  }

  async analyzeCodebaseStructure(projectId: string, githubUrl: string) {
    console.log(`Analyzing codebase structure for project ${projectId}`);

    const { owner, repo } = this.parseGithubUrl(githubUrl);
    
    try {
      // Get repository structure
      const repoInfo = await this.octokit.rest.repos.get({ owner, repo });
      const languages = await this.octokit.rest.repos.listLanguages({ owner, repo });
      const tree = await this.getRepositoryTree(owner, repo);

      // Analyze structure
      const structure = this.analyzeProjectStructure(tree);
      
      // Store analysis results
      await db.project.update({
        where: { id: projectId },
        data: {
          processingLogs: {
            ...(await this.getExistingLogs(projectId)),
            codebaseAnalysis: {
              languages,
              structure,
              lastAnalyzed: new Date().toISOString(),
              totalFiles: tree.filter(item => item.type === 'blob').length,
              directories: tree.filter(item => item.type === 'tree').length
            }
          }
        }
      });

      return structure;
    } catch (error) {
      console.error(`Error analyzing codebase structure:`, error);
      throw error;
    }
  }

  async identifyKeyFiles(projectId: string, githubUrl: string) {
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

  private async checkFileExists(owner: string, repo: string, path: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({ owner, repo, path });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      
      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      return null;
    }
  }

  private async reindexSingleFile(projectId: string, filePath: string, content: string) {
    try {
      // Create document for processing
      const doc = {
        pageContent: content,
        metadata: { source: filePath }
      };

      // Generate summary and embedding
      const summary = await summariseCode(doc);
      if (!summary || summary.trim() === "") {
        console.warn(`Empty summary for ${filePath}, skipping`);
        return;
      }

      const embedding = await generateEmbedding(summary);

      // Update or create the embedding record
      const existingEmbedding = await db.sourceCodeEmbedding.findFirst({
        where: { projectId, fileName: filePath }
      });

      if (existingEmbedding) {
        // Update existing
        await db.sourceCodeEmbedding.update({
          where: { id: existingEmbedding.id },
          data: {
            summary,
            sourceCode: JSON.stringify(content),
            updatedAt: new Date()
          }
        });

        await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${embedding}::vector
          WHERE "id" = ${existingEmbedding.id}
        `;
      } else {
        // Create new
        const newEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            summary,
            sourceCode: JSON.stringify(content),
            fileName: filePath,
            projectId
          }
        });

        await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${embedding}::vector
          WHERE "id" = ${newEmbedding.id}
        `;
      }

      console.log(`Successfully re-indexed: ${filePath}`);
    } catch (error) {
      console.error(`Error re-indexing file ${filePath}:`, error);
      throw error;
    }
  }

  private async removeFileFromIndex(projectId: string, filePath: string) {
    try {
      await db.sourceCodeEmbedding.deleteMany({
        where: { projectId, fileName: filePath }
      });
      console.log(`Removed ${filePath} from index`);
    } catch (error) {
      console.error(`Error removing ${filePath} from index:`, error);
    }
  }

  private parseGithubUrl(githubUrl: string): { owner: string; repo: string } {
    const parts = githubUrl.replace('https://github.com/', '').split('/');
    return { owner: parts[0], repo: parts[1] };
  }

  private async getRepositoryTree(owner: string, repo: string) {
    const { data: tree } = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: '1'
    });

    return tree.tree;
  }

  private analyzeProjectStructure(tree: any[]) {
    const structure = {
      configFiles: [] as string[],
      entryPoints: [] as string[],
      coreFiles: [] as string[],
      apiFiles: [] as string[],
      schemaFiles: [] as string[],
      testFiles: [] as string[],
      documentationFiles: [] as string[],
      framework: this.detectFramework(tree)
    };

    tree.forEach(item => {
      if (item.type !== 'blob') return;

      const path = item.path;
      
      // Configuration files
      if (this.isConfigFile(path)) {
        structure.configFiles.push(path);
      }
      
      // Entry points
      if (this.isEntryPoint(path)) {
        structure.entryPoints.push(path);
      }
      
      // API files
      if (this.isApiFile(path)) {
        structure.apiFiles.push(path);
      }
      
      // Schema files
      if (this.isSchemaFile(path)) {
        structure.schemaFiles.push(path);
      }
      
      // Test files
      if (this.isTestFile(path)) {
        structure.testFiles.push(path);
      }
      
      // Documentation
      if (this.isDocumentationFile(path)) {
        structure.documentationFiles.push(path);
      }
      
      // Core business logic (heuristic)
      if (this.isCoreFile(path, structure.framework)) {
        structure.coreFiles.push(path);
      }
    });

    return structure;
  }

  private detectFramework(tree: any[]): string {
    const files = tree.map(item => item.path);
    
    if (files.includes('next.config.js') || files.includes('next.config.ts')) {
      return 'nextjs';
    }
    if (files.includes('nuxt.config.js') || files.includes('nuxt.config.ts')) {
      return 'nuxt';
    }
    if (files.includes('angular.json')) {
      return 'angular';
    }
    if (files.includes('vue.config.js')) {
      return 'vue';
    }
    if (files.some(f => f.includes('package.json'))) {
      return 'nodejs';
    }
    
    return 'unknown';
  }

  private isConfigFile(path: string): boolean {
    const configPatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /webpack\.config\./,
      /vite\.config\./,
      /next\.config\./,
      /tailwind\.config\./,
      /eslint\.config\./,
      /\.env/,
      /docker-compose\.ya?ml$/,
      /Dockerfile$/
    ];
    
    return configPatterns.some(pattern => pattern.test(path));
  }

  private isEntryPoint(path: string): boolean {
    const entryPatterns = [
      /^src\/main\./,
      /^src\/index\./,
      /^src\/app\./,
      /^pages\/_app\./,
      /^app\/layout\./,
      /^src\/App\./
    ];
    
    return entryPatterns.some(pattern => pattern.test(path));
  }

  private isApiFile(path: string): boolean {
    const apiPatterns = [
      /\/api\//,
      /\/routes\//,
      /\/controllers\//,
      /\/endpoints\//,
      /server\/.*\.ts$/,
      /backend\/.*\.ts$/
    ];
    
    return apiPatterns.some(pattern => pattern.test(path));
  }

  private isSchemaFile(path: string): boolean {
    const schemaPatterns = [
      /schema\.prisma$/,
      /\/models\//,
      /\/schemas\//,
      /\/database\//,
      /migration/
    ];
    
    return schemaPatterns.some(pattern => pattern.test(path));
  }

  private isTestFile(path: string): boolean {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /__tests__\//,
      /\/tests?\//
    ];
    
    return testPatterns.some(pattern => pattern.test(path));
  }

  private isDocumentationFile(path: string): boolean {
    const docPatterns = [
      /README/i,
      /\.md$/,
      /\/docs?\//,
      /CHANGELOG/i,
      /LICENSE/i
    ];
    
    return docPatterns.some(pattern => pattern.test(path));
  }

  private isCoreFile(path: string, framework: string): boolean {
    // Framework-specific core file detection
    const genericCorePatterns = [
      /src\/.*\.(ts|tsx|js|jsx)$/,
      /lib\/.*\.(ts|tsx|js|jsx)$/,
      /utils\/.*\.(ts|tsx|js|jsx)$/,
      /components\/.*\.(ts|tsx|js|jsx)$/,
      /hooks\/.*\.(ts|tsx|js|jsx)$/
    ];

    const frameworkSpecific = {
      nextjs: [
        /^app\/.*\.(ts|tsx)$/,
        /^pages\/.*\.(ts|tsx|js|jsx)$/,
        /^src\/app\/.*\.(ts|tsx)$/
      ],
      nuxt: [
        /^pages\/.*\.(vue|ts|js)$/,
        /^components\/.*\.(vue|ts|js)$/
      ],
      angular: [
        /^src\/app\/.*\.(ts|html|scss)$/
      ]
    };

    const patterns = [
      ...genericCorePatterns,
      ...(frameworkSpecific[framework] || [])
    ];

    return patterns.some(pattern => pattern.test(path)) && 
           !this.isTestFile(path) && 
           !this.isConfigFile(path);
  }

  private async getExistingLogs(projectId: string) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { processingLogs: true }
    });

    return project?.processingLogs || {};
  }
}