// Push event processing
import { inngest } from "@/lib/inngest/client";
import type { WebhookPayload, Project } from "../types";
import { processCommitUpdate, processFileChanges } from "../database-operations";
import { shouldTriggerReindexing } from "../reindexing-logic";

export async function handlePushEvent(payload: WebhookPayload, projects: Project[]): Promise<void> {
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
      await processCommitUpdate(project.id, commit, payload.repository.html_url);
    }

    // Check for file changes that require re-indexing
    const allChangedFiles = [
      ...headCommit.added,
      ...headCommit.modified,
      ...headCommit.removed
    ];

    if (allChangedFiles.length > 0) {
      await processFileChanges(project.id, {
        added: headCommit.added,
        modified: headCommit.modified,
        removed: headCommit.removed
      }, payload.repository.html_url);
    }

    // Trigger smart re-indexing for significant changes
    if (shouldTriggerReindexing(allChangedFiles)) {
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