// AI processing and batch handling for commits
import { aisummariseCommit, delay } from "../../gemini";
import { getCommitDiff } from "./github-api";
import { markCommitAsFailed, updateCommitSummary } from "./database-operations";
import type { CommitResponse } from "./types";

// Process a single commit with AI summarization
export const processSingleCommit = async (
  projectId: string,
  commit: CommitResponse,
  githubUrl: string
): Promise<boolean> => {
  try {
    // Get commit diff
    const diff = await getCommitDiff(githubUrl, commit.commitHash);
    
    // Generate AI summary
    const summary = await aisummariseCommit(diff);
    
    // Update database with summary
    await updateCommitSummary(projectId, commit.commitHash, summary);
    
    return true;
  } catch (error) {
    console.error(`Error processing commit ${commit.commitHash}:`, error);
    
    // Mark as failed in database
    await markCommitAsFailed(projectId, commit.commitHash, error);
    
    return false;
  }
};

// Process commits in batches with rate limiting
export const processCommitsInBatches = async (
  projectId: string,
  commits: CommitResponse[],
  githubUrl: string
): Promise<number> => {
  const BATCH_SIZE = 3;
  let successCount = 0;
  
  for (let i = 0; i < commits.length; i += BATCH_SIZE) {
    const batch = commits.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(commits.length/BATCH_SIZE)} (${batch.length} commits)`);
    
    const batchPromises = batch.map(commit => 
      processSingleCommit(projectId, commit, githubUrl)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    const batchSuccessCount = batchResults.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    successCount += batchSuccessCount;
    
    // Add delay between batches to respect rate limits
    if (i + BATCH_SIZE < commits.length) {
      console.log("Pausing between batches...");
      await delay(2000);
    }
  }
  
  return successCount;
};