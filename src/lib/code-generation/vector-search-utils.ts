// src/lib/code-generation/vector-search-utils.ts
import type { PrismaClient } from "@prisma/client";

export interface QueryResult {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}

export interface FileContent {
  fileName: string;
  sourceCode: string;
  summary?: string;
}

/**
 * Utilities for vector search and file content retrieval
 * Extracted from ai-code-service.ts for reuse across strategies
 */
export class VectorSearchUtils {
  /**
   * Find relevant files using vector similarity search
   */
  static async findRelevantFiles(
    db: PrismaClient,
    query: string, 
    projectId: string, 
    threshold: number = 0.3,
    limit: number = 5
  ): Promise<QueryResult[]> {
    const { generateEmbedding } = await import('@/lib/gemini');
    const queryEmbedding = await generateEmbedding(query);
    const vectorQuery = `[${queryEmbedding.join(',')}]`;

    const relevantFiles = await db.$queryRaw`
      SELECT "fileName", "sourceCode", "summary",
      1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
      FROM "SourceCodeEmbedding"
      WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > ${threshold}
      AND "projectId" = ${projectId}
      ORDER BY similarity DESC
      LIMIT ${limit}
    ` as QueryResult[];

    return relevantFiles;
  }

  /**
   * Get file contents by file names
   */
  static async getFileContents(
    db: PrismaClient,
    projectId: string, 
    fileNames: string[]
  ): Promise<FileContent[]> {
    const fileContents = await db.sourceCodeEmbedding.findMany({
      where: {
        projectId,
        fileName: { in: fileNames }
      },
      select: {
        fileName: true,
        sourceCode: true,
        summary: true
      }
    });

    return fileContents.map(f => ({
      fileName: f.fileName,
      sourceCode: typeof f.sourceCode === 'string' ? f.sourceCode : JSON.stringify(f.sourceCode),
      summary: f.summary
    }));
  }

  /**
   * Format file contents for prompt inclusion
   */
  static formatFilesForPrompt(files: QueryResult[] | FileContent[], includeRelevance: boolean = false): string {
    return files.map(f => {
      const relevanceInfo = includeRelevance && 'similarity' in f 
        ? `\nRelevance: ${Math.round(f.similarity * 100)}%` 
        : '';
      
      const summaryInfo = f.summary ? `\nSummary: ${f.summary}` : '';

      return `File: ${f.fileName}
Code: ${f.sourceCode}${summaryInfo}${relevanceInfo}`;
    }).join('\n\n');
  }

  /**
   * Format files for review context (simplified format)
   */
  static formatFilesForReview(files: FileContent[]): string {
    return files.map(f => `
      File: ${f.fileName}
      Content:
      ${f.sourceCode}
      `).join('\n\n');
  }

  /**
   * Get files for code review (by specific file names)
   */
  static async getFilesForReview(
    db: PrismaClient,
    projectId: string,
    fileNames: string[]
  ): Promise<FileContent[]> {
    const files = await this.getFileContents(db, projectId, fileNames);
    
    if (files.length === 0) {
      throw new Error('No files found for review');
    }

    return files;
  }

  /**
   * Get files for explanation (either specific files or vector search)
   */
  static async getFilesForExplanation(
    db: PrismaClient,
    projectId: string,
    query: string,
    targetFiles?: string[]
  ): Promise<{ files: QueryResult[] | FileContent[]; isVectorSearch: boolean }> {
    if (targetFiles && targetFiles.length > 0) {
      const files = await this.getFileContents(db, projectId, targetFiles);
      return { files, isVectorSearch: false };
    } else {
      // Use vector search with higher threshold for explanations
      const files = await this.findRelevantFiles(db, query, projectId, 0.4, 3);
      return { files, isVectorSearch: true };
    }
  }

  /**
   * Get files for debugging (either specific files or vector search)
   */
  static async getFilesForDebugging(
    db: PrismaClient,
    projectId: string,
    errorDescription: string,
    suspectedFiles?: string[]
  ): Promise<{ files: QueryResult[] | FileContent[]; isVectorSearch: boolean }> {
    if (suspectedFiles && suspectedFiles.length > 0) {
      const files = await this.getFileContents(db, projectId, suspectedFiles);
      return { files, isVectorSearch: false };
    } else {
      // Use vector search for error-related code
      const files = await this.findRelevantFiles(db, errorDescription, projectId, 0.3, 5);
      return { files, isVectorSearch: true };
    }
  }

  /**
   * Validate that files were found
   */
  static validateFilesFound(files: any[], operation: string): void {
    if (files.length === 0) {
      throw new Error(`No files found for ${operation}`);
    }
  }
}