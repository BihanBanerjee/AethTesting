import { inngest } from "../../client";
import { db } from "@/server/db";
import type { CommitProcessingStatus } from "@prisma/client";

export const processSingleCommit = inngest.createFunction(
  {
    id: "aetheria-process-single-commit",
    name: "Process Single Commit",
    retries: 2,
    concurrency: {
      limit: 5,
      key: "global"
    }
  },
  { event: "project.commit.process.requested" },
  async ({ event, step }) => {
    const { 
      projectId, 
      commit, 
      githubUrl, 
      commitIndex, 
      totalCommits, 
      waveIndex,
      totalWaves,
      delaySeconds 
    } = event.data;

    try {
      // Step 1: Mark as processing
      await step.run("mark-processing", async () => {
        return await db.commit.upsert({
          where: {
            projectId_commitHash: {
              projectId,
              commitHash: commit.commitHash
            }
          },
          update: {
            processingStatus: 'PROCESSING'
          },
          create: {
            projectId,
            commitHash: commit.commitHash,
            commitMessage: commit.commitMessage,
            commitAuthorName: commit.commitAuthorName,
            commitAuthorAvatar: commit.commitAuthorAvatar,
            commitDate: commit.commitDate,
            summary: "Processing in progress...",
            processingStatus: 'PROCESSING'
          }
        });
      });

      // Wave delay
      if (delaySeconds && delaySeconds > 0) {
        await step.sleep("wave-delay", `${delaySeconds}s`);
      }

      // Random delay within wave
      const randomDelay = Math.floor(Math.random() * 3000);
      if (randomDelay > 0) {
        await step.sleep("random-delay", `${randomDelay}ms`);
      }

      // Step 2: Process the commit
      const result = await step.run("process-commit", async () => {
        try {
          console.log(`🌊 Wave ${waveIndex + 1}/${totalWaves} - Processing commit ${commitIndex + 1}/${totalCommits}: ${commit.commitHash.substring(0, 8)}`);
          
          // Get commit diff
          const axios = (await import("axios")).default;
          
          let diffData;
          try {
            const { data } = await axios.get(
              `${githubUrl}/commit/${commit.commitHash}.diff`, 
              { 
                timeout: 15000,
                headers: { 'Accept': 'application/vnd.github.v3.diff' }
              }
            );
            diffData = data;
          } catch (diffError) {
            console.error(`Error fetching diff for commit ${commit.commitHash}:`, diffError);
            diffData = "Unable to fetch commit diff";
          }
          
          // Generate AI summary
          const { aisummariseCommit } = await import("@/lib/gemini");
          let summary;
          let processingStatus: CommitProcessingStatus = 'FAILED';
          
          try {
            summary = await aisummariseCommit(diffData);
            if (summary && summary.trim().length > 0 && !summary.includes("Failed to")) {
              processingStatus = 'COMPLETED';
            } else {
              summary = `Processing failed: Unable to generate AI summary for commit ${commit.commitMessage || commit.commitHash.substring(0, 8)}`;
            }
          } catch (summaryError) {
            console.error(`Error summarizing commit ${commit.commitHash}:`, summaryError);
            summary = `Processing failed: ${summaryError instanceof Error ? summaryError.message : 'AI summary generation failed'}`;
          }
          
          // Update in database
          const updatedCommit = await db.commit.upsert({
            where: {
              projectId_commitHash: {
                projectId,
                commitHash: commit.commitHash
              }
            },
            update: {
              summary: summary || "Failed to process commit",
              processingStatus,
              updatedAt: new Date()
            },
            create: {
              projectId,
              commitHash: commit.commitHash,
              commitMessage: commit.commitMessage,
              commitAuthorName: commit.commitAuthorName,
              commitAuthorAvatar: commit.commitAuthorAvatar,
              commitDate: commit.commitDate,
              summary: summary || "Failed to process commit",
              processingStatus
            }
          });
          
          const statusEmoji = processingStatus === 'COMPLETED' ? '✅' : '❌';
          console.log(`${statusEmoji} Wave ${waveIndex + 1} - Commit: ${commit.commitHash.substring(0, 8)} - Status: ${processingStatus}`);
          
          return { 
            success: processingStatus === 'COMPLETED', 
            commitHash: commit.commitHash,
            processingStatus,
            savedCommitId: updatedCommit.id,
            waveIndex
          };
          
        } catch (error) {
          console.error(`❌ Wave ${waveIndex + 1} - Error processing commit ${commit.commitHash}:`, error);
          
          // Mark as failed in database
          try {
            const failedCommit = await db.commit.upsert({
              where: {
                projectId_commitHash: {
                  projectId,
                  commitHash: commit.commitHash
                }
              },
              update: {
                summary: `Processing failed: ${error instanceof Error ? error.message?.substring(0, 100) : 'Unknown error'}`,
                processingStatus: 'FAILED',
                updatedAt: new Date()
              },
              create: {
                projectId,
                commitHash: commit.commitHash,
                commitMessage: commit.commitMessage,
                commitAuthorName: commit.commitAuthorName,
                commitAuthorAvatar: commit.commitAuthorAvatar,
                commitDate: commit.commitDate,
                summary: `Processing failed: ${error instanceof Error ? error.message?.substring(0, 100) : 'Unknown error'}`,
                processingStatus: 'FAILED'
              }
            });
            
            return { 
              success: false, 
              error: error instanceof Error ? error.message : String(error), 
              commitHash: commit.commitHash,
              processingStatus: 'FAILED' as CommitProcessingStatus,
              fallbackCommitId: failedCommit.id,
              waveIndex
            };
          } catch (dbError) {
            console.error(`Failed to create failed commit record:`, dbError);
            return { 
              success: false, 
              error: error instanceof Error ? error.message : String(error), 
              commitHash: commit.commitHash,
              processingStatus: 'FAILED' as CommitProcessingStatus,
              waveIndex
            };
          }
        }
      });

      return result;

    } catch (error) {
      console.error(`Failed to process commit ${commit.commitHash}:`, error);
      throw error;
    }
  }
);