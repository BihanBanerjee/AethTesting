// src/app/(protected)/dashboard/actions/analysis/project-context.ts
import { db } from '@/server/db';
import type { ProjectContext } from '../types/action-types';
import { analyzeTechStack } from './tech-stack-analyzer';
import { analyzeArchitecture } from './architecture-analyzer';
import { buildProjectStructure } from './project-structure';
import { analyzeCodingStandards } from './coding-standards-analyzer';

export async function getProjectContext(projectId: string): Promise<ProjectContext> {
  // Get recent files and project structure
  const recentFiles = await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    orderBy: { id: 'desc' },
    take: 10,
    select: { fileName: true, summary: true }
  });

  // Analyze tech stack from file extensions and content
  const allFiles = await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    select: { fileName: true, sourceCode: true }
  });

  const techStack = analyzeTechStack(allFiles);
  const architecture = analyzeArchitecture(allFiles);
  const structure = buildProjectStructure(allFiles);
  const standards = analyzeCodingStandards(allFiles);

  return {
    recentFiles,
    techStack,
    architecture,
    structure,
    standards
  };
}