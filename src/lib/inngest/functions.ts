// src/lib/inngest/functions.ts
import { inngest } from "./client";
import { loadGithubRepo } from "@/lib/github-loader";
import { summariseCode, generateEmbedding } from "@/lib/gemini";
import { checkTranscriptionStatus, retrieveTranscriptionResults, submitMeetingForProcessing } from "@/lib/assembly";
import { SmartReindexer } from "@/lib/smart-reindexer";
import { db } from "@/server/db";
import type { CommitProcessingStatus } from "@prisma/client";

export type ProjectStatus = 
  | "INITIALIZING" 
  | "LOADING_REPO"
  | "INDEXING_REPO" 
  | "POLLING_COMMITS" 
  | "DEDUCTING_CREDITS" 
  | "COMPLETED" 
  | "FAILED";

export type MeetingStatus = 
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

// PROJECT CREATION FUNCTIONS

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

// COMMIT PROCESSING FUNCTIONS

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
            summary = `Processing failed: ${summaryError.message || 'AI summary generation failed'}`;
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
                summary: `Processing failed: ${error.message?.substring(0, 100) || 'Unknown error'}`,
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
                summary: `Processing failed: ${error.message?.substring(0, 100) || 'Unknown error'}`,
                processingStatus: 'FAILED'
              }
            });
            
            return { 
              success: false, 
              error: error.message, 
              commitHash: commit.commitHash,
              processingStatus: 'FAILED' as CommitProcessingStatus,
              fallbackCommitId: failedCommit.id,
              waveIndex
            };
          } catch (dbError) {
            console.error(`Failed to create failed commit record:`, dbError);
            return { 
              success: false, 
              error: error.message, 
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

// WEBHOOK-TRIGGERED FUNCTIONS (NEW)

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
  async ({ event, step }) => {
    const { projectId, githubUrl, changedFiles, commitHash, reason } = event.data;

    try {
      console.log(`🔄 Smart re-indexing ${changedFiles.length} files for project ${projectId} (reason: ${reason})`);

      // Step 1: Initialize smart reindexer
      const reindexer = await step.run("initialize-reindexer", async () => {
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

        return new SmartReindexer(process.env.GITHUB_TOKEN);
      });

      // Step 2: Re-index changed files
      const results = await step.run("reindex-files", async () => {
        return await reindexer.reindexChangedFiles(projectId, githubUrl, changedFiles);
      });

      // Step 3: Update project logs
      await step.run("update-logs", async () => {
        const existingProject = await db.project.findUnique({
          where: { id: projectId },
          select: { processingLogs: true }
        });

        const existingLogs = existingProject?.processingLogs || {};

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
                filesProcessed: results.filter(r => r.status === 'reindexed').length,
                filesRemoved: results.filter(r => r.status === 'removed').length,
                errors: results.filter(r => r.status === 'error').length
              }
            }
          }
        });

        return results;
      });

      console.log(`✅ Smart re-indexing completed for project ${projectId}`);
      return { 
        success: true, 
        projectId, 
        filesProcessed: results.filter(r => r.status === 'reindexed').length,
        filesRemoved: results.filter(r => r.status === 'removed').length,
        errors: results.filter(r => r.status === 'error').length
      };

    } catch (error) {
      console.error(`❌ Smart re-indexing failed for project ${projectId}:`, error);
      throw error;
    }
  }
);

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

export const analyzePullRequest = inngest.createFunction(
  {
    id: "aetheria-analyze-pull-request",
    name: "Analyze Pull Request",
    retries: 1,
    concurrency: {
      limit: 3,
      key: "event.data.projectId"
    }
  },
  { event: "pullrequest.analysis.requested" },
  async ({ event, step }) => {
    const { 
      projectId, 
      prNumber, 
      action, 
      title, 
      state, 
      merged, 
      baseBranch, 
      headBranch, 
      githubUrl 
    } = event.data;

    try {
      console.log(`🔍 Analyzing PR #${prNumber} for project ${projectId} (action: ${action})`);

      // Step 1: Analyze PR impact
      const analysis = await step.run("analyze-pr-impact", async () => {
        // This is where you could implement PR analysis logic
        // For now, we'll create a basic analysis structure
        return {
          prNumber,
          action,
          title,
          state,
          merged,
          baseBranch,
          headBranch,
          riskLevel: 'medium', // Could be calculated based on changes
          affectedFiles: [], // Could be extracted from PR diff
          recommendations: []
        };
      });

      // Step 2: Store PR analysis (if you have a PRAnalysis table)
      await step.run("store-analysis", async () => {
        // You could store PR analysis results in the database here
        console.log(`PR analysis completed for #${prNumber}:`, analysis);
        return analysis;
      });

      return { success: true, projectId, analysis };

    } catch (error) {
      console.error(`❌ PR analysis failed for project ${projectId}, PR #${prNumber}:`, error);
      throw error;
    }
  }
);

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
  async ({ event, step }) => {
    const { projectId, releaseAction, releaseName, releaseTag, githubUrl } = event.data;

    try {
      console.log(`🚀 Processing release event for project ${projectId}: ${releaseAction} - ${releaseName}`);

      // Step 1: Analyze release impact
      const analysis = await step.run("analyze-release", async () => {
        // Implement release analysis logic here
        return {
          releaseAction,
          releaseName,
          releaseTag,
          timestamp: new Date().toISOString()
        };
      });

      // Step 2: Update project with release info
      await step.run("update-project-release-info", async () => {
        const existingProject = await db.project.findUnique({
          where: { id: projectId },
          select: { processingLogs: true }
        });

        const existingLogs = existingProject?.processingLogs || {};

        await db.project.update({
          where: { id: projectId },
          data: {
            processingLogs: {
              ...existingLogs,
              lastRelease: analysis
            }
          }
        });

        return analysis;
      });

      return { success: true, projectId, analysis };

    } catch (error) {
      console.error(`❌ Release processing failed for project ${projectId}:`, error);
      throw error;
    }
  }
);

// MEETING PROCESSING (EXISTING)

export const processMeetingFunction = inngest.createFunction(
  {
    id: "aetheria-process-meeting",
    name: "Aetheria: Process Meeting Recording", 
    retries: 1,
    concurrency: {
      limit: 3,
      key: "event.data.userId",
    },
  },
  { event: "meeting.processing.requested" },
  async ({ event, step }) => {
    const { meetingUrl, meetingId, projectId, userId } = event.data;

    try {
      console.log(`Starting to process meeting ${meetingId} for user ${userId}`);

      // Step 1: Validate meeting (< 10 seconds)
      const validationResult = await step.run("validate-meeting", async () => {
        const meeting = await db.meeting.findUnique({
          where: { id: meetingId },
          include: {
            project: {
              include: {
                userToProjects: {
                  where: { userId },
                  select: { userId: true }
                }
              }
            }
          }
        });

        if (!meeting) {
          throw new Error(`Meeting ${meetingId} not found`);
        }

        if (meeting.project.userToProjects.length === 0) {
          throw new Error(`User ${userId} not authorized for meeting ${meetingId}`);
        }

        if (meeting.status !== 'PROCESSING') {
          console.log(`Meeting ${meetingId} already processed with status: ${meeting.status}`);
          return { alreadyProcessed: true };
        }

        console.log(`Meeting ${meetingId} validated, starting processing`);
        return { alreadyProcessed: false };
      });

      if (validationResult.alreadyProcessed) {
        return { success: true, message: "Meeting already processed" };
      }

      // Step 2: Submit transcription job (< 10 seconds)
      const transcriptionJob = await step.run("submit-transcription", async () => {
        console.log(`Submitting transcription job for meeting ${meetingId}`);
        return await submitMeetingForProcessing(meetingUrl);
      });

      // Step 3: Poll for completion (each poll < 10 seconds)
      let transcriptionStatus;
      let pollAttempts = 0;
      const maxPolls = 20; // Maximum 20 polls = ~10 minutes max wait time

      do {
        pollAttempts++;
        
        // Wait before polling (except first attempt)
        if (pollAttempts > 1) {
          await step.sleep("wait-before-poll", `${30}s`); // Wait 30 seconds between polls
        }

        transcriptionStatus = await step.run(`poll-transcription-${pollAttempts}`, async () => {
          console.log(`Polling transcription status (attempt ${pollAttempts}/${maxPolls}) for meeting ${meetingId}`);
          return await checkTranscriptionStatus(transcriptionJob.transcriptId);
        });

        console.log(`Poll ${pollAttempts}: Status = ${transcriptionStatus.status}`);

        // Check for failure
        if (transcriptionStatus.status === 'error') {
          throw new Error(`Transcription failed: ${transcriptionStatus.error}`);
        }

        // Check for timeout
        if (pollAttempts >= maxPolls && transcriptionStatus.status !== 'completed') {
          throw new Error(`Transcription timeout after ${maxPolls} polling attempts`);
        }

      } while (transcriptionStatus.status !== 'completed');

      // Step 4: Retrieve results (< 10 seconds)
      const meetingData = await step.run("retrieve-transcription-results", async () => {
        console.log(`Retrieving transcription results for meeting ${meetingId}`);
        
        try {
          const result = await retrieveTranscriptionResults(transcriptionJob.transcriptId);
          
          if (!result.summaries || result.summaries.length === 0) {
            throw new Error('No summaries generated from transcription');
          }
          
          console.log(`Successfully retrieved ${result.summaries.length} discussion points for meeting ${meetingId}`);
          return result.summaries;
        } catch (error) {
          console.error(`Error retrieving transcription results for ${meetingId}:`, error);
          
          // Create fallback summary
          const fallbackSummary = {
            start: "00:00",
            end: "00:00",
            gist: "Meeting Processing Failed",
            headline: "Unable to process audio",
            summary: `Meeting audio could not be processed due to: ${error.message}. Please try re-uploading the meeting or contact support if the issue persists.`
          };
          
          return [fallbackSummary];
        }
      });

      // Step 5: Save issues to database (< 10 seconds)
      await step.run("save-meeting-issues", async () => {
        console.log(`Saving ${meetingData.length} issues to database for meeting ${meetingId}`);
        
        try {
          // Check if issues already exist
          const existingIssues = await db.issue.findMany({
            where: { meetingId }
          });

          if (existingIssues.length > 0) {
            console.log(`Issues already exist for meeting ${meetingId}, skipping creation`);
            return { savedIssues: existingIssues.length, skipped: true };
          }

          // Batch insert all issues
          await db.issue.createMany({
            data: meetingData.map(summary => ({
              start: summary.start,
              end: summary.end,
              gist: summary.gist,
              headline: summary.headline,
              summary: summary.summary,
              meetingId
            }))
          });

          console.log(`Successfully saved ${meetingData.length} issues for meeting ${meetingId}`);
          return { savedIssues: meetingData.length, skipped: false };
        } catch (error) {
          console.error(`Error saving issues for meeting ${meetingId}:`, error);
          throw new Error(`Failed to save issues: ${error.message}`);
        }
      });

      // Step 6: Update meeting status (< 5 seconds)
      await step.run("update-meeting-status", async () => {
        console.log(`Updating meeting ${meetingId} status to COMPLETED`);
        
        try {
          const meetingName = meetingData[0]?.headline || 'Meeting Summary';
          
          const updatedMeeting = await db.meeting.update({
            where: { id: meetingId },
            data: {
              status: 'COMPLETED',
              name: meetingName
            }
          });

          console.log(`Meeting ${meetingId} successfully completed with name: ${meetingName}`);
          return updatedMeeting;
        } catch (error) {
          console.error(`Error updating meeting status for ${meetingId}:`, error);
          throw new Error(`Failed to update meeting status: ${error.message}`);
        }
      });

      console.log(`Meeting ${meetingId} processing completed successfully`);
      return { 
        success: true, 
        meetingId, 
        issuesCreated: meetingData.length,
        meetingName: meetingData[0]?.headline || 'Meeting Summary'
      };

    } catch (error) {
      console.error(`Error processing meeting ${meetingId}:`, error);
      
      // Mark meeting as failed with detailed error info
      await step.run("mark-meeting-failed", async () => {
        try {
          return await db.meeting.update({
            where: { id: meetingId },
            data: { 
              status: 'COMPLETED', // Keep as COMPLETED but with error info in issues
              name: `Processing Failed: ${error.message.substring(0, 50)}...`
            }
          });
        } catch (dbError) {
          console.error(`Failed to update meeting status to failed:`, dbError);
          return null;
        }
      });

      throw error;
    }
  }
);

// Export all functions in a flat array
export const functions = [
  // Project Creation
  processProjectCreation, 
  processSingleCommit,
  
  // Webhook-triggered functions
  processSmartReindexing,
  processFileChanges,
  analyzePullRequest,
  processRelease,
  
  // Meeting Processing
  processMeetingFunction
];