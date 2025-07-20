import { db } from "@/server/db";
import { summariseCode, generateEmbedding } from "../gemini";
import { GitHubClient } from "./github-client";
import type { ReindexingResult } from "./types";

export class FileProcessor {
  private githubClient: GitHubClient;

  constructor(githubToken?: string) {
    this.githubClient = new GitHubClient(githubToken);
  }

  async reindexChangedFiles(
    projectId: string, 
    githubUrl: string, 
    changedFiles: string[]
  ): Promise<ReindexingResult[]> {
    console.log(`Smart re-indexing ${changedFiles.length} files for project ${projectId}`);

    const { owner, repo } = this.githubClient.parseGithubUrl(githubUrl);
    const results: ReindexingResult[] = [];

    for (const filePath of changedFiles) {
      try {
        // Check if file still exists (wasn't deleted)
        const fileExists = await this.githubClient.checkFileExists(owner, repo, filePath);
        
        if (!fileExists) {
          // Remove from index if deleted
          await this.removeFileFromIndex(projectId, filePath);
          results.push({ filePath, status: 'removed' });
          continue;
        }

        // Get file content
        const fileContent = await this.githubClient.getFileContent(owner, repo, filePath);
        
        if (!fileContent) {
          console.warn(`Could not fetch content for ${filePath}`);
          continue;
        }

        // Re-index the file
        await this.reindexSingleFile(projectId, filePath, fileContent);
        results.push({ filePath, status: 'reindexed' });

      } catch (error) {
        console.error(`Error re-indexing file ${filePath}:`, error);
        results.push({ filePath, status: 'error', error: error instanceof Error ? error.message : String(error) });
      }
    }

    this.logReindexingResults(results);
    return results;
  }

  private async reindexSingleFile(projectId: string, filePath: string, content: string): Promise<void> {
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
        await this.updateExistingEmbedding(existingEmbedding.id, summary, content, embedding);
      } else {
        // Create new
        await this.createNewEmbedding(projectId, filePath, summary, content, embedding);
      }

      console.log(`Successfully re-indexed: ${filePath}`);
    } catch (error) {
      console.error(`Error re-indexing file ${filePath}:`, error);
      throw error;
    }
  }

  private async updateExistingEmbedding(
    id: string, 
    summary: string, 
    content: string, 
    embedding: number[]
  ): Promise<void> {
    await db.sourceCodeEmbedding.update({
      where: { id },
      data: {
        summary,
        sourceCode: JSON.stringify(content),
        updatedAt: new Date()
      }
    });

    await db.$executeRaw`
      UPDATE "SourceCodeEmbedding"
      SET "summaryEmbedding" = ${embedding}::vector
      WHERE "id" = ${id}
    `;
  }

  private async createNewEmbedding(
    projectId: string, 
    filePath: string, 
    summary: string, 
    content: string, 
    embedding: number[]
  ): Promise<void> {
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

  private async removeFileFromIndex(projectId: string, filePath: string): Promise<void> {
    try {
      await db.sourceCodeEmbedding.deleteMany({
        where: { projectId, fileName: filePath }
      });
      console.log(`Removed ${filePath} from index`);
    } catch (error) {
      console.error(`Error removing ${filePath} from index:`, error);
    }
  }

  private logReindexingResults(results: ReindexingResult[]): void {
    console.log(`Re-indexing completed. Results:`, {
      reindexed: results.filter(r => r.status === 'reindexed').length,
      removed: results.filter(r => r.status === 'removed').length,
      errors: results.filter(r => r.status === 'error').length
    });
  }
}