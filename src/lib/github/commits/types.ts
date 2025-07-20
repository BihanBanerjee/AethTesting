// Shared types for commit processing
export type CommitResponse = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

export type ProcessingStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CommitProcessingResult {
  count: number;
}

export interface ParsedGithubUrl {
  owner: string;
  repo: string;
}

export interface ProjectGithubUrl {
  githubUrl: string;
}