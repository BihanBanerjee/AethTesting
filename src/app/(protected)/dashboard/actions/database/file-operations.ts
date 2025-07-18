// src/app/(protected)/dashboard/actions/database/file-operations.ts
import { db } from '@/server/db';
import type { DatabaseFile } from '../types/action-types';

export async function getFilesByNames(
  projectId: string,
  fileNames: string[]
): Promise<DatabaseFile[]> {
  return await db.sourceCodeEmbedding.findMany({
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
}

export async function getAllProjectFiles(projectId: string): Promise<DatabaseFile[]> {
  return await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    select: { fileName: true, sourceCode: true }
  });
}

export async function getRecentFiles(projectId: string, limit: number = 10) {
  return await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    orderBy: { id: 'desc' },
    take: limit,
    select: { fileName: true, summary: true }
  });
}

export function formatFileContext(files: DatabaseFile[]): string {
  return files.map(f => `
File: ${f.fileName}
Code: ${f.sourceCode}
Summary: ${f.summary}
`).join('\n\n');
}

export function formatFileContextWithRelevance(files: Array<DatabaseFile & { similarity?: number }>): string {
  return files.map(f => `
File: ${f.fileName}
Code: ${f.sourceCode}
Summary: ${f.summary}
${f.similarity ? `Relevance: ${Math.round(f.similarity * 100)}%` : ''}
`).join('\n\n');
}