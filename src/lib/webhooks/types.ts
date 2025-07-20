// GitHub webhook types and interfaces
export interface GitHubCommit {
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

export interface GitHubRepository {
  full_name: string;
  html_url: string;
  default_branch: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  base: { ref: string };
  head: { ref: string };
}

export interface GitHubRelease {
  name: string;
  tag_name: string;
}

export interface WebhookPayload {
  action: string;
  repository: GitHubRepository;
  commits?: GitHubCommit[];
  head_commit?: GitHubCommit;
  ref?: string;
  before?: string;
  after?: string;
  pull_request?: GitHubPullRequest;
  release?: GitHubRelease;
}

export interface Project {
  id: string;
  githubUrl: string;
  deletedAt: Date | null;
}

export interface FileChanges {
  added: string[];
  modified: string[];
  removed: string[];
}

export interface CommitData {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
}