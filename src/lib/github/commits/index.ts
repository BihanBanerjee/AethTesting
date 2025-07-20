// Main orchestrator for commit processing
export { octokit, getCommitHashes } from "./github-api";
export type { CommitResponse } from "./types";
export { processCommitsInBatches } from "./commit-processor";
export { 
  fetchProjectGithubUrl,
  filterUnprocessedCommits,
  markCommitAsProcessing 
} from "./database-operations";

// Re-export the main pollCommits function
import { getCommitHashes } from "./github-api";
import { 
  fetchProjectGithubUrl,
  filterUnprocessedCommits,
  markCommitAsProcessing 
} from "./database-operations";
import { processCommitsInBatches } from "./commit-processor";
import type { CommitProcessingResult } from "./types";

// Poll commits for a project and process them
export const pollCommits = async (projectId: string): Promise<CommitProcessingResult> => {
  try {
    console.log(`Polling commits for project ${projectId}`);
    
    const { githubUrl } = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl);
    console.log(`Found ${commitHashes.length} total commits from GitHub`);
    
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);
    console.log(`Found ${unprocessedCommits.length} commits needing (re)processing`);
    
    if (unprocessedCommits.length === 0) {
      console.log("No commits need processing");
      return { count: 0 };
    }
    
    // Mark commits as PROCESSING before starting
    for (const commit of unprocessedCommits) {
      await markCommitAsProcessing(projectId, commit);
    }
    
    // Process commits in batches
    const successCount = await processCommitsInBatches(projectId, unprocessedCommits, githubUrl);
    
    console.log(`Successfully processed ${successCount} out of ${unprocessedCommits.length} commits`);
    return { count: successCount };
    
  } catch (error) {
    console.error("Error in pollCommits:", error);
    throw error;
  }
};