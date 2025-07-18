// src/app/(protected)/dashboard/actions/database/vector-search.ts
import { generateEmbedding } from '@/lib/gemini';
import { db } from '@/server/db';
import type { VectorSearchResult } from '../types/action-types';

export async function performVectorSearch(
  query: string,
  projectId: string,
  options: {
    similarityThreshold: number;
    resultLimit: number;
  }
): Promise<VectorSearchResult[]> {
  const queryVector = await generateEmbedding(query);
  const vectorQuery = `[${queryVector.join(',')}]`;

  const result = await db.$queryRaw`
    SELECT "fileName","sourceCode", "summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > ${options.similarityThreshold}
    AND "projectId" = ${projectId}
    ORDER BY similarity DESC
    LIMIT ${options.resultLimit}
  ` as VectorSearchResult[];

  return result;
}

export async function performDebugVectorSearch(
  errorDescription: string,
  projectId: string
): Promise<VectorSearchResult[]> {
  const errorVector = await generateEmbedding(errorDescription);
  const vectorQuery = `[${errorVector.join(',')}]`;

  const relevantFiles = await db.$queryRaw`
    SELECT "fileName", "sourceCode", "summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
    AND "projectId" = ${projectId}
    ORDER BY similarity DESC
    LIMIT 5
  ` as VectorSearchResult[];

  return relevantFiles;
}