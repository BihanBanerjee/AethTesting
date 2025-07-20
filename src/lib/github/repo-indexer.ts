import type { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode, delay } from "../gemini";
import { db } from "@/server/db";
import type { IndexingResult, IndexingStats } from "./types";
import { RepoLoader } from "./repo-loader";

export class RepoIndexer {
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_DELAY = 2000; // 2 seconds
  private repoLoader: RepoLoader;

  constructor() {
    this.repoLoader = new RepoLoader();
  }

  async indexGithubRepo(projectId: string, githubUrl: string, githubToken?: string): Promise<number> {
    try {
      const docs = await this.repoLoader.loadGithubRepo(githubUrl, githubToken);
      console.log(`Starting to process ${docs.length} files`);
      
      const results = await this.processDocumentsInBatches(docs);
      const savedCount = await this.saveResultsToDatabase(projectId, results);
      
      console.log(`Successfully processed ${results.length} files out of ${docs.length}`);
      return savedCount;
    } catch (error) {
      console.error("Error indexing GitHub repo:", error);
      throw new Error(`Failed to index GitHub repository: ${error}`);
    }
  }

  private async processDocumentsInBatches(docs: Document[]): Promise<IndexingResult[]> {
    const results: IndexingResult[] = [];
    
    for (let i = 0; i < docs.length; i += this.BATCH_SIZE) {
      console.log(`Processing batch ${i/this.BATCH_SIZE + 1} of ${Math.ceil(docs.length/this.BATCH_SIZE)}`);
      const batch = docs.slice(i, i + this.BATCH_SIZE);
      
      const batchResults = await Promise.allSettled(
        batch.map(doc => this.processDocument(doc))
      );
      
      // Extract successful results and filter out nulls
      const successfulResults = batchResults
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<IndexingResult | null>).value!)
        .filter(Boolean);
      
      results.push(...successfulResults);
      
      // Add delay between batches to avoid rate limiting
      if (i + this.BATCH_SIZE < docs.length) {
        console.log("Pausing between batches to avoid rate limiting...");
        await delay(this.BATCH_DELAY);
      }
    }
    
    return results;
  }

  private async processDocument(doc: Document): Promise<IndexingResult | null> {
    try {
      const summary = await summariseCode(doc);
      
      // Skip processing if we got an empty summary
      if (!summary || summary.trim() === "") {
        console.warn(`Empty summary for ${doc.metadata.source}, skipping`);
        return null;
      }
      
      const embedding = await generateEmbedding(summary);
      
      return { 
        summary, 
        embedding, 
        sourceCode: doc.pageContent, 
        fileName: doc.metadata.source
      };
    } catch (error) {
      console.error(`Error processing file ${doc.metadata.source}:`, error);
      return null;
    }
  }

  private async saveResultsToDatabase(projectId: string, results: IndexingResult[]): Promise<number> {
    let savedCount = 0;
    
    for (const embedding of results) {
      try {
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            summary: embedding.summary,
            sourceCode: JSON.stringify(embedding.sourceCode),
            fileName: embedding.fileName,
            projectId,
          }
        });

        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}
        `;
        
        console.log(`Saved embedding for ${embedding.fileName}`);
        savedCount++;
      } catch (dbError) {
        console.error(`Database error for ${embedding.fileName}:`, dbError);
      }
    }
    
    return savedCount;
  }

  getIndexingStats(totalFiles: number, processedFiles: number): IndexingStats {
    return {
      totalFiles,
      successfullyProcessed: processedFiles,
      errors: totalFiles - processedFiles
    };
  }
}