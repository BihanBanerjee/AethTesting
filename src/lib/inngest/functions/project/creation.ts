import { inngest } from "../../client";
import { loadGithubRepo } from "@/lib/github-loader";
import { summariseCode, generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";

export const processProjectCreation = inngest.createFunction(
  { 
    id: "aetheria-process-project-creation",
    name: "Aetheria: Process Project Creation",
    retries: 1,
    concurrency: {
      limit: 2,
      key: "event.data.userId",
    },
  },
  { event: "project.creation.requested" },
  async ({ event, step }) => {
    const { projectId, githubUrl, githubToken, userId, fileCount } = event.data;

    try {
      // Step 1: Load repository files (< 30 seconds - just fetching file list)
      const docs = await step.run("load-github-repo", async () => {
        await db.project.update({
          where: { id: projectId },
          data: { status: 'LOADING_REPO' }
        });
        
        const docs = await loadGithubRepo(githubUrl, githubToken);
        console.log(`Loaded ${docs.length} files for project ${projectId}`);
        
        await db.project.update({
          where: { id: projectId },
          data: { 
            status: 'INDEXING_REPO',
            totalFiles: docs.length,
            processedFiles: 0
          }
        });
        
        return docs;
      });

      // Step 2: Process files in SMALL batches to stay under 60 seconds
      const SMALL_BATCH_SIZE = 2; // Process only 2 files per step (30 seconds each max)
      const totalBatches = Math.ceil(docs.length / SMALL_BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * SMALL_BATCH_SIZE;
        const endIndex = Math.min(startIndex + SMALL_BATCH_SIZE, docs.length);
        const batch = docs.slice(startIndex, endIndex);
        
        await step.run(`process-file-batch-${batchIndex}`, async () => {
          console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} files)`);
          
          // Process each file in the small batch
          for (const doc of batch) {
            try {
              console.log(`Processing file: ${doc.metadata.source}`);
              
              // Single file processing (should be < 30 seconds)
              const summary = await summariseCode(doc);
              if (!summary || summary.trim() === "") {
                console.warn(`Empty summary for ${doc.metadata.source}, skipping`);
                continue;
              }
              
              const embedding = await generateEmbedding(summary);
              
              // Save immediately
              const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
                data: {
                  summary: summary,
                  sourceCode: JSON.stringify(doc.pageContent),
                  fileName: doc.metadata.source,
                  projectId,
                }
              });

              await db.$executeRaw`
                UPDATE "SourceCodeEmbedding"
                SET "summaryEmbedding" = ${embedding}::vector
                WHERE "id" = ${sourceCodeEmbedding.id}
              `;
              
              console.log(`✅ Processed: ${doc.metadata.source}`);
            } catch (error) {
              console.error(`❌ Error processing ${doc.metadata.source}:`, error);
              // Continue with next file instead of failing entire batch
            }
          }
          
          // Update progress after each batch
          await db.project.update({
            where: { id: projectId },
            data: { processedFiles: endIndex }
          });
          
          return { batchIndex, processedFiles: endIndex };
        });
        
        // Small delay between batches to avoid overwhelming APIs
        if (batchIndex < totalBatches - 1) {
          await step.sleep("batch-delay", "2s");
        }
      }

      // Step 3: Queue commits in batches for controlled parallel processing
      await step.run("queue-commit-processing", async () => {
        await db.project.update({
          where: { id: projectId },
          data: { status: 'POLLING_COMMITS' }
        });

        const project = await db.project.findUnique({
          where: { id: projectId },
          select: { githubUrl: true }
        });
        
        if (!project?.githubUrl) {
          throw new Error(`Project ${projectId} has no GitHub URL`);
        }
        
        const { getCommitHashes } = await import("@/lib/github");
        const commitHashes = await getCommitHashes(project.githubUrl);
        
        // Filter unprocessed commits
        const processedCommits = await db.commit.findMany({
          where: { projectId },
          select: { commitHash: true }
        });
        
        const processedHashes = new Set(processedCommits.map(commit => commit.commitHash));
        const unprocessedCommits = commitHashes.filter(commit => !processedHashes.has(commit.commitHash));

        console.log(`Queuing ${unprocessedCommits.length} commits for processing`);

        // Process commits in waves - better than sequential!
        const WAVE_SIZE = 3; // Process 3 commits simultaneously
        const WAVE_DELAY = 20; // 20 seconds between waves
        const totalWaves = Math.ceil(unprocessedCommits.length / WAVE_SIZE);
        
        for (let waveIndex = 0; waveIndex < totalWaves; waveIndex++) {
          const startIndex = waveIndex * WAVE_SIZE;
          const endIndex = Math.min(startIndex + WAVE_SIZE, unprocessedCommits.length);
          const waveCommits = unprocessedCommits.slice(startIndex, endIndex);
          
          // Queue all commits in this wave to start at the same time
          for (let i = 0; i < waveCommits.length; i++) {
            const commit = waveCommits[i];
            const globalIndex = startIndex + i;
            
            await inngest.send({
              name: "project.commit.process.requested",
              data: {
                projectId,
                commit,
                githubUrl: project.githubUrl,
                commitIndex: globalIndex,
                totalCommits: unprocessedCommits.length,
                waveIndex,
                totalWaves,
                // All commits in the same wave start together
                delaySeconds: waveIndex * WAVE_DELAY
              }
            });
          }
        }
        
        const estimatedTime = totalWaves * WAVE_DELAY;
        console.log(`📊 Queued ${unprocessedCommits.length} commits in ${totalWaves} waves. Estimated completion: ${estimatedTime} seconds`);
        
        return { 
          queuedCommits: unprocessedCommits.length,
          githubUrl: project.githubUrl,
          waves: totalWaves,
          estimatedTimeSeconds: estimatedTime
        };
      });

      // Step 4: Deduct credits (< 5 seconds)
      await step.run("deduct-credits", async () => {
        await db.project.update({
          where: { id: projectId },
          data: { status: 'DEDUCTING_CREDITS' }
        });
        
        return await db.user.update({
          where: { id: userId },
          data: {
            credits: {
              decrement: fileCount
            }
          }
        });
      });

      // Step 5: Mark as completed (< 5 seconds)
      // Note: We mark as completed even though commits may still be processing
      // The commits will be processed asynchronously in the background
      await step.run("mark-completed", async () => {
        return await db.project.update({
          where: { id: projectId },
          data: { status: 'COMPLETED' }
        });
      });

      console.log(`✅ Project ${projectId} fully processed! Commits are being processed in background.`);
      return { success: true, projectId, indexedFiles: docs.length };

    } catch (error) {
      console.error(`❌ Error processing project ${projectId}:`, error);
      
      await step.run("mark-failed", async () => {
        return await db.project.update({
          where: { id: projectId },
          data: { status: 'FAILED' }
        });
      });

      throw error;
    }
  }
);