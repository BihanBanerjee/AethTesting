import { Octokit } from "octokit";

export class GitHubClient {
  private octokit: Octokit;

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken || process.env.GITHUB_TOKEN
    });
  }

  async checkFileExists(owner: string, repo: string, path: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({ owner, repo, path });
      return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path });
      
      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      return null;
    }
  }

  async getRepositoryInfo(owner: string, repo: string) {
    return this.octokit.rest.repos.get({ owner, repo });
  }

  async getRepositoryLanguages(owner: string, repo: string) {
    return this.octokit.rest.repos.listLanguages({ owner, repo });
  }

  async getRepositoryTree(owner: string, repo: string) {
    const { data: tree } = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: '1'
    });

    return tree.tree;
  }

  parseGithubUrl(githubUrl: string): { owner: string; repo: string } {
    const parts = githubUrl.replace('https://github.com/', '').split('/');
    return { owner: parts[0] || "", repo: parts[1] || "" };
  }
}