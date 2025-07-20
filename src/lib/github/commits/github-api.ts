// GitHub API operations for commit handling
import { Octokit } from "octokit";
import type { CommitResponse } from "./types";
import { parseGithubUrl } from "./utils";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Get commit hashes from a GitHub repository
export const getCommitHashes = async (githubUrl: string): Promise<CommitResponse[]> => {
  try {
    // Extract owner and repo from GitHub URL
    const { owner, repo } = parseGithubUrl(githubUrl);
    
    if (!owner || !repo) {
      throw new Error('Invalid GitHub URL: ' + githubUrl);
    }
    
    console.log(`Fetching commits for ${owner}/${repo}`);
    
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 25 // Increase limit to get more commits if needed
    });

    const sortedCommits = data.sort((a, b) => 
      new Date(b.commit.author?.date || 0).getTime() - 
      new Date(a.commit.author?.date || 0).getTime()
    );

    return sortedCommits.slice(0, 15).map((commit) => ({
      commitHash: commit.sha as string,
      commitMessage: commit.commit.message ?? "",
      commitAuthorName: commit.commit?.author?.name ?? "",
      commitAuthorAvatar: commit?.author?.avatar_url ?? "",
      commitDate: commit.commit?.author?.date ?? ""
    }));
  } catch (error) {
    console.error("Error fetching commit hashes:", error);
    throw new Error(`Failed to fetch commits: ${error}`);
  }
};

// Get commit diff from GitHub
export const getCommitDiff = async (githubUrl: string, commitHash: string): Promise<string> => {
  try {
    const { owner, repo } = parseGithubUrl(githubUrl);
    
    if (!owner || !repo) {
      throw new Error('Invalid GitHub URL: ' + githubUrl);
    }

    const { data: commitData } = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitHash
    });
    
    // Extract diff from the commit
    const diff = commitData.files?.map(file => 
      `--- ${file.filename}\n${file.patch || ''}`
    ).join('\n\n') || '';
    
    return diff;
  } catch (error) {
    console.error(`Error fetching commit diff for ${commitHash}:`, error);
    throw new Error(`Failed to fetch commit diff: ${error}`);
  }
};