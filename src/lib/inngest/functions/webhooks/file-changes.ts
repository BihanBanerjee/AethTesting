import { inngest } from "../../client";
import { SmartReindexer } from "@/lib/smart-reindexer";

export const processFileChanges = inngest.createFunction(
  {
    id: "aetheria-process-file-changes",
    name: "Process File Changes from Webhook",
    retries: 1,
    concurrency: {
      limit: 5,
      key: "event.data.projectId"
    }
  },
  { event: "project.files.reindex.requested" },
  async ({ event, step }) => {
    const { projectId, files, githubUrl, reason } = event.data;

    try {
      console.log(`📁 Processing ${files.length} file changes for project ${projectId} (reason: ${reason})`);

      // Step 1: Process files in batches
      const BATCH_SIZE = 3;
      const results = [];

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        
        const batchResults = await step.run(`process-file-batch-${Math.floor(i / BATCH_SIZE)}`, async () => {
          const reindexer = new SmartReindexer(process.env.GITHUB_TOKEN);
          return await reindexer.reindexChangedFiles(projectId, githubUrl, batch);
        });

        results.push(...batchResults);

        // Small delay between batches
        if (i + BATCH_SIZE < files.length) {
          await step.sleep("batch-delay", "2s");
        }
      }

      console.log(`✅ File changes processed for project ${projectId}`);
      return { 
        success: true, 
        projectId, 
        totalFiles: files.length,
        results
      };

    } catch (error) {
      console.error(`❌ File changes processing failed for project ${projectId}:`, error);
      throw error;
    }
  }
);