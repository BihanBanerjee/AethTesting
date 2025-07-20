import { Octokit } from "octokit";
import type { FileCountResult } from "./types";

export class FileCounter {
  private octokit: Octokit;

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken || process.env.GITHUB_TOKEN,
    });
  }

  async getFileCount(githubUrl: string): Promise<number> {
    const { owner, repo } = this.parseGithubUrl(githubUrl);
    
    if (!owner || !repo) {
      return 0;
    }
    
    try {
      const result = await this.getFileCountOptimized(owner, repo);
      return result.count;
    } catch (error) {
      console.error("Error counting files:", error);
      throw error;
    }
  }

  private async getFileCountOptimized(owner: string, repo: string): Promise<FileCountResult> {
    try {
      // Get the default branch
      const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo });
      const defaultBranch = repoData.default_branch;
      
      // Get the commit SHA of the head of the default branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`
      });
      
      const commitSha = refData.object.sha;
      
      // Get the entire file tree in one request
      const { data: treeData } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: commitSha,
        recursive: '1'
      });
      
      // Count only files (not directories)
      const fileCount = treeData.tree.filter(item => item.type === 'blob').length;
      
      return { count: fileCount, method: 'git-tree' };
    } catch (error) {
      console.error("Git Trees API failed, falling back to directory traversal");
      
      try {
        const count = await this.getFileCountByTraversal("", owner, repo, 0);
        return { count, method: 'directory-traversal' };
      } catch (fallbackError) {
        console.error("Both file counting methods failed:", fallbackError);
        throw error;
      }
    }
  }

  private async getFileCountByTraversal(
    path: string, 
    owner: string, 
    repo: string, 
    acc: number = 0
  ): Promise<number> {
    const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
    
    if (!Array.isArray(data) && data.type === 'file') {
      return acc + 1;
    }
    
    if (Array.isArray(data)) {
      let fileCount = 0;
      const directories: string[] = [];

      for (const item of data) {
        if (item.type === 'dir') {
          directories.push(item.path);
        } else {
          fileCount++;
        }
      }

      if (directories.length > 0) {
        const directoryCounts = await Promise.all(
          directories.map(directory => this.getFileCountByTraversal(directory, owner, repo, 0))
        );
        fileCount += directoryCounts.reduce((acc, count) => acc + count, 0);
      }
      
      return acc + fileCount;
    }
    
    return acc;
  }

  private parseGithubUrl(githubUrl: string): { owner: string; repo: string } {
    const parts = githubUrl.split("/");
    return {
      owner: parts[3] || "",
      repo: parts[4] || ""
    };
  }
}

// Convenience function for backward compatibility
export const checkCredits = async (githubUrl: string, githubToken?: string): Promise<number> => {
  const counter = new FileCounter(githubToken);
  return counter.getFileCount(githubUrl);
};