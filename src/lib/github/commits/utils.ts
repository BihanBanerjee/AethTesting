// Utility functions for commit processing
import type { ParsedGithubUrl } from "./types";

// Parse GitHub URL to extract owner and repo
export const parseGithubUrl = (githubUrl: string): ParsedGithubUrl => {
  const urlParts = githubUrl.split('/');
  return {
    owner: urlParts[urlParts.length - 2] || "",
    repo: urlParts[urlParts.length - 1] || ""
  };
};