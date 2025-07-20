import { inngest } from "../../client";
import { SmartReindexer } from "@/lib/smart-reindexer";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

interface ReindexResult {
  filePath: string;
  status: 'reindexed' | 'removed' | 'error';
  error?: string;
}

interface SmartReindexEventData {
  projectId: string;
  githubUrl: string;
  changedFiles: string[];
  commitHash: string;
  reason: string;
}

interface SmartReindexEvent {
  data: SmartReindexEventData;
}

interface InngestStep {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
  sleep: (id: string, duration: string) => Promise<void>;
}

// Type guard for reindex results
const isReindexResult = (result: unknown): result is ReindexResult => {
  return (
    typeof result === 'object' &&
    result !== null &&
    'filePath' in result &&
    'status' in result &&
    typeof (result as Record<string, unknown>).filePath === 'string' &&
    typeof (result as Record<string, unknown>).status === 'string'
  );
};

export const processSmartReindexing = inngest.createFunction(
  {
    id: "aetheria-smart-reindex",
    name: "Smart Re-index Changed Files",
    retries: 1,
    concurrency: {
      limit: 3,
      key: "event.data.projectId"
    }
  },
  { event: "project.smart.reindex.requested" },
  async ({ event, step }: { event: SmartReindexEvent; step: InngestStep }) => {
    const { projectId, githubUrl, changedFiles, commitHash, reason } = event.data;

    try {
      console.log(`🔄 Smart re-indexing ${changedFiles.length} files for project ${projectId} (reason: ${reason})`);

      // Step 1: Initialize smart reindexer
      await step.run<{ id: string }>("validate-project", async () => {
        // Get project's GitHub token if available
        const project = await db.project.findUnique({
          where: { id: projectId },
          include: {
            userToProjects: {
              take: 1,
              include: { user: true }
            }
          }
        });

        if (!project) {
          throw new Error(`Project ${projectId} not found`);
        }

        return project;
      });

      const reindexer = new SmartReindexer(process.env.GITHUB_TOKEN);

      // Step 2: Re-index changed files
      const results: unknown[] = await step.run("reindex-files", async () => {
        return await reindexer.reindexChangedFiles(projectId, githubUrl, changedFiles, process.env.GITHUB_TOKEN);
      });

      // Step 3: Update project logs
      await step.run<unknown[]>("update-logs", async () => {
        const existingProject = await db.project.findUnique({
          where: { id: projectId },
          select: { processingLogs: true }
        });

        const existingLogs = (existingProject?.processingLogs as Record<string, unknown>) || {};

        await db.project.update({
          where: { id: projectId },
          data: {
            processingLogs: {
              ...existingLogs,
              lastReindex: {
                timestamp: new Date().toISOString(),
                commitHash,
                reason,
                changedFiles,
                results,
                filesProcessed: results.filter((r: unknown) => isReindexResult(r) && r.status === 'reindexed').length,
                filesRemoved: results.filter((r: unknown) => isReindexResult(r) && r.status === 'removed').length,
                errors: results.filter((r: unknown) => isReindexResult(r) && r.status === 'error').length
              }
            } as Prisma.InputJsonValue
          }
        });

        return results;
      });

      console.log(`✅ Smart re-indexing completed for project ${projectId}`);
      return { 
        success: true as const, 
        projectId, 
        filesProcessed: results.filter((r: unknown) => isReindexResult(r) && r.status === 'reindexed').length,
        filesRemoved: results.filter((r: unknown) => isReindexResult(r) && r.status === 'removed').length,
        errors: results.filter((r: unknown) => isReindexResult(r) && r.status === 'error').length
      } as const;

    } catch (error) {
      console.error(`❌ Smart re-indexing failed for project ${projectId}:`, error);
      throw error;
    }
  }
);