// Database operations for webhook processing
import { db } from "@/server/db";
import { inngest } from "@/lib/inngest/client";
import type { GitHubCommit, FileChanges } from "./types";

export async function processCommitUpdate(
  projectId: string, 
  commit: GitHubCommit, 
  githubUrl: string
): Promise<void> {
  try {
    // Check if commit already exists
    const existingCommit = await db.commit.findUnique({
      where: {
        projectId_commitHash: {
          projectId,
          commitHash: commit.id
        }
      }
    });

    if (existingCommit) {
      console.log(`Commit ${commit.id} already exists, skipping`);
      return;
    }

    // Queue commit for processing
    await inngest.send({
      name: "project.commit.process.requested",
      data: {
        projectId,
        commit: {
          commitHash: commit.id,
          commitMessage: commit.message,
          commitAuthorName: commit.author.name,
          commitAuthorAvatar: '', // Will be populated during processing
          commitDate: commit.timestamp
        },
        githubUrl,
        isWebhookTriggered: true
      }
    });

    console.log(`Queued commit ${commit.id} for processing`);
  } catch (error) {
    console.error(`Error processing commit update for ${commit.id}:`, error);
  }
}

export async function processFileChanges(
  projectId: string, 
  changes: FileChanges,
  githubUrl: string
): Promise<void> {
  try {
    console.log(`Processing file changes for project ${projectId}:`, {
      added: changes.added.length,
      modified: changes.modified.length,
      removed: changes.removed.length
    });

    // Handle removed files
    if (changes.removed.length > 0) {
      await db.sourceCodeEmbedding.deleteMany({
        where: {
          projectId,
          fileName: {
            in: changes.removed
          }
        }
      });
      console.log(`Removed ${changes.removed.length} deleted files from index`);
    }

    // Queue modified/added files for re-indexing
    const filesToReindex = [...changes.added, ...changes.modified];
    if (filesToReindex.length > 0) {
      await inngest.send({
        name: "project.files.reindex.requested",
        data: {
          projectId,
          files: filesToReindex,
          githubUrl,
          reason: "webhook_file_changes"
        }
      });
    }

  } catch (error) {
    console.error(`Error processing file changes for project ${projectId}:`, error);
  }
}

export async function getProjectsForRepository(githubUrl: string) {
  return await db.project.findMany({
    where: {
      githubUrl: githubUrl,
      deletedAt: null
    }
  });
}