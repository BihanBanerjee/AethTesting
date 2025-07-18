// src/lib/webhook-helpers.ts
import { db } from "@/server/db";
import { inngest } from "@/lib/inngest/client";

interface GitHubCommit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  added: string[];
  removed: string[];
  modified: string[];
  timestamp: string;
}

interface WebhookPayload {
  action: string;
  repository: {
    full_name: string;
    html_url: string;
    default_branch: string;
  };
  commits?: GitHubCommit[];
  head_commit?: GitHubCommit;
  ref?: string;
  before?: string;
  after?: string;
  pull_request?: {
    number: number;
    title: string;
    state: string;
    merged: boolean;
    base: { ref: string };
    head: { ref: string };
  };
}

export class WebhookProcessor {
  
  static async handlePushEvent(payload: WebhookPayload, projects: any[]) {
    const commits = payload.commits || [];
    const headCommit = payload.head_commit;
    
    if (!headCommit) {
      console.log('No head commit in push event');
      return;
    }

    // Only process pushes to the default branch
    const isDefaultBranch = payload.ref === `refs/heads/${payload.repository.default_branch}`;
    if (!isDefaultBranch) {
      console.log(`Ignoring push to non-default branch: ${payload.ref}`);
      return;
    }

    console.log(`Processing push with ${commits.length} commits to default branch`);

    for (const project of projects) {
      // Process new commits
      for (const commit of commits) {
        await this.processCommitUpdate(project.id, commit, payload.repository.html_url);
      }

      // Check for file changes that require re-indexing
      const allChangedFiles = [
        ...headCommit.added,
        ...headCommit.modified,
        ...headCommit.removed
      ];

      if (allChangedFiles.length > 0) {
        await this.processFileChanges(project.id, {
          added: headCommit.added,
          modified: headCommit.modified,
          removed: headCommit.removed
        }, payload.repository.html_url);
      }

      // Trigger smart re-indexing for significant changes
      if (this.shouldTriggerReindexing(allChangedFiles)) {
        await inngest.send({
          name: "project.smart.reindex.requested",
          data: {
            projectId: project.id,
            githubUrl: payload.repository.html_url,
            changedFiles: allChangedFiles,
            commitHash: headCommit.id,
            reason: "significant_changes"
          }
        });
      }
    }
  }

  static async handlePullRequestEvent(payload: any, projects: any[]) {
    console.log(`Processing pull request event: ${payload.action}`);
    
    for (const project of projects) {
      await inngest.send({
        name: "pullrequest.analysis.requested",
        data: {
          projectId: project.id,
          prNumber: payload.pull_request.number,
          action: payload.action,
          title: payload.pull_request.title,
          state: payload.pull_request.state,
          merged: payload.pull_request.merged,
          baseBranch: payload.pull_request.base.ref,
          headBranch: payload.pull_request.head.ref,
          githubUrl: payload.repository.html_url
        }
      });
    }
  }

  static async handleRepositoryEvent(payload: any, projects: any[]) {
    console.log(`Processing repository event: ${payload.action}`);
    
    // Handle repository events like branch creation, deletion, etc.
    if (payload.action === 'deleted') {
      // Archive projects associated with deleted repository
      for (const project of projects) {
        await db.project.update({
          where: { id: project.id },
          data: { deletedAt: new Date() }
        });
      }
    }
  }

  static async handleReleaseEvent(payload: any, projects: any[]) {
    console.log(`Processing release event: ${payload.action}`);
    
    // Handle release events for documentation updates
    for (const project of projects) {
      await inngest.send({
        name: "project.release.analysis.requested",
        data: {
          projectId: project.id,
          releaseAction: payload.action,
          releaseName: payload.release?.name,
          releaseTag: payload.release?.tag_name,
          githubUrl: payload.repository.html_url
        }
      });
    }
  }

  private static async processCommitUpdate(projectId: string, commit: GitHubCommit, githubUrl: string) {
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

  private static async processFileChanges(
    projectId: string, 
    changes: { added: string[]; modified: string[]; removed: string[] },
    githubUrl: string
  ) {
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

  private static shouldTriggerReindexing(changedFiles: string[]): boolean {
    // Trigger re-indexing for significant changes
    const significantPatterns = [
      /package\.json$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
      /pnpm-lock\.yaml$/,
      /Dockerfile$/,
      /docker-compose\.ya?ml$/,
      /\.env/,
      /tsconfig\.json$/,
      /tailwind\.config\./,
      /next\.config\./,
      /prisma\/schema\.prisma$/,
      /src\/.*\.(ts|tsx|js|jsx)$/
    ];

    return changedFiles.some(file => 
      significantPatterns.some(pattern => pattern.test(file))
    ) || changedFiles.length > 10; // Or if many files changed
  }

  static async getProjectsForRepository(githubUrl: string) {
    return await db.project.findMany({
      where: {
        githubUrl: githubUrl,
        deletedAt: null
      }
    });
  }
}

// Updated webhook signature verification
export function verifyGitHubSignature(body: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET not configured');
    return false;
  }

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(body).digest('hex')}`;
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}