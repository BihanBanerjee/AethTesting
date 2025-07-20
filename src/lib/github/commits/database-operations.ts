// Database operations for commit processing
import { db } from "@/server/db";
import type { CommitResponse, ProjectGithubUrl } from "./types";

// Fetch project GitHub URL from database
export const fetchProjectGithubUrl = async (projectId: string): Promise<ProjectGithubUrl> => {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { githubUrl: true }
  });
  
  if (!project?.githubUrl) {
    throw new Error(`Project ${projectId} not found or missing GitHub URL`);
  }
  
  return { githubUrl: project.githubUrl };
};

// Filter out commits that are already completed
export const filterUnprocessedCommits = async (
  projectId: string, 
  commitHashes: CommitResponse[]
): Promise<CommitResponse[]> => {
  // Get existing commits from database
  const existingCommits = await db.commit.findMany({
    where: { projectId },
    select: { 
      commitHash: true, 
      processingStatus: true 
    }
  });
  
  const existingHashMap = new Map(
    existingCommits.map(commit => [commit.commitHash, commit.processingStatus])
  );
  
  // Filter out commits that are already COMPLETED
  return commitHashes.filter(commit => {
    const status = existingHashMap.get(commit.commitHash);
    return status !== 'COMPLETED';
  });
};

// Mark commit as processing in database
export const markCommitAsProcessing = async (
  projectId: string,
  commit: CommitResponse
): Promise<void> => {
  try {
    await db.commit.upsert({
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
  } catch (error) {
    console.error(`Error upserting commit ${commit.commitHash}:`, error);
    throw error;
  }
};

// Update commit with summary and mark as completed
export const updateCommitSummary = async (
  projectId: string,
  commitHash: string,
  summary: string
): Promise<void> => {
  await db.commit.update({
    where: {
      projectId_commitHash: {
        projectId,
        commitHash
      }
    },
    data: {
      summary,
      processingStatus: 'COMPLETED'
    }
  });
};

// Mark commit as failed with error message
export const markCommitAsFailed = async (
  projectId: string,
  commitHash: string,
  error: unknown
): Promise<void> => {
  await db.commit.update({
    where: {
      projectId_commitHash: {
        projectId,
        commitHash
      }
    },
    data: {
      summary: `Error processing: ${error instanceof Error ? error.message : String(error)}`,
      processingStatus: 'FAILED'
    }
  });
};