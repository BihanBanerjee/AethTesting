import { inngest } from "../../client";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

interface ReleaseEventData {
  projectId: string;
  releaseAction: string;
  releaseName: string;
  releaseTag: string;
  githubUrl: string;
}

interface ReleaseEvent {
  data: ReleaseEventData;
}

interface InngestStep {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
  sleep: (id: string, duration: string) => Promise<void>;
}

interface ReleaseAnalysis {
  releaseAction: string;
  releaseName: string;
  releaseTag: string;
  githubUrl: string;
  timestamp: string;
}

export const processRelease = inngest.createFunction(
  {
    id: "aetheria-process-release",
    name: "Process Release Events",
    retries: 1,
    concurrency: {
      limit: 2,
      key: "event.data.projectId"
    }
  },
  { event: "project.release.analysis.requested" },
  async ({ event, step }: { event: ReleaseEvent; step: InngestStep }) => {
    const { projectId, releaseAction, releaseName, releaseTag, githubUrl } = event.data;

    try {
      console.log(`🚀 Processing release event for project ${projectId}: ${releaseAction} - ${releaseName} (${githubUrl})`);

      // Step 1: Analyze release impact
      const analysis: ReleaseAnalysis = await step.run<ReleaseAnalysis>("analyze-release", async () => {
        // Implement release analysis logic here
        return {
          releaseAction,
          releaseName,
          releaseTag,
          githubUrl,
          timestamp: new Date().toISOString()
        };
      });

      // Step 2: Update project with release info
      await step.run<ReleaseAnalysis>("update-project-release-info", async () => {
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
              lastRelease: analysis
            } as unknown as Prisma.InputJsonValue
          }
        });

        return analysis;
      });

      return { success: true as const, projectId, analysis } as const;

    } catch (error) {
      console.error(`❌ Release processing failed for project ${projectId}:`, error);
      throw error;
    }
  }
);