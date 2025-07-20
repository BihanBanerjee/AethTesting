import { RepoLoader } from "./repo-loader";
import { RepoIndexer } from "./repo-indexer";

// Main exports for the github module
export { FileCounter, checkCredits } from "./file-counter";
export { RepoLoader } from "./repo-loader";
export { RepoIndexer } from "./repo-indexer";
export type { FileCountResult, IndexingResult, IndexingStats } from "./types";

// Commit handling exports
export { 
  pollCommits, 
  getCommitHashes, 
  octokit,
  type CommitResponse 
} from "./commits";

// Combined convenience function that maintains the original API
export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
  const loader = new RepoLoader();
  return loader.loadGithubRepo(githubUrl, githubToken);
};

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
  const indexer = new RepoIndexer();
  return indexer.indexGithubRepo(projectId, githubUrl, githubToken);
};