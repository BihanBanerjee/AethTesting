import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import type { Document } from "@langchain/core/documents";

export class RepoLoader {
  private readonly defaultIgnoreFiles = [
    'package-lock.json', 
    'pnpm-lock.yaml', 
    'yarn.lock', 
    'bun.lockb',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.ttf', '.woff', '.woff2',
    '.mp4', '.webm', '.mp3', '.wav', '.ogg',
    '.xls', '.xlsx', '.ppt', '.pptx'
  ];

  async loadGithubRepo(githubUrl: string, githubToken?: string): Promise<Document[]> {
    try {
      const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || '',
        branch: 'main',
        ignoreFiles: this.defaultIgnoreFiles,
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 3, // Reduced concurrency to prevent rate limiting
      });
      
      const docs = await loader.load();
      console.log(`Loaded ${docs.length} files from repository`);
      return docs;
    } catch (error) {
      console.error("Error loading GitHub repo:", error);
      throw new Error(`Failed to load GitHub repository: ${error}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setIgnoreFiles(ignoreFiles: string[]): void {
    // This could be used to customize ignore patterns per project
  }
}