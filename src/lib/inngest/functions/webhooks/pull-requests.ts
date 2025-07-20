import { inngest } from "../../client";

interface PullRequestEventData {
  projectId: string;
  prNumber: number;
  action: string;
  title: string;
  state: string;
  merged: boolean;
  baseBranch: string;
  headBranch: string;
  githubUrl: string;
}

interface PullRequestEvent {
  data: PullRequestEventData;
}

interface InngestStep {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
  sleep: (id: string, duration: string) => Promise<void>;
}

interface PRAnalysis {
  prNumber: number;
  action: string;
  title: string;
  state: string;
  merged: boolean;
  baseBranch: string;
  headBranch: string;
  githubUrl: string;
  riskLevel: 'low' | 'medium' | 'high';
  affectedFiles: string[];
  recommendations: string[];
}

export const analyzePullRequest = inngest.createFunction(
  {
    id: "aetheria-analyze-pull-request",
    name: "Analyze Pull Request",
    retries: 1,
    concurrency: {
      limit: 3,
      key: "event.data.projectId"
    }
  },
  { event: "pullrequest.analysis.requested" },
  async ({ event, step }: { event: PullRequestEvent; step: InngestStep }) => {
    const { 
      projectId, 
      prNumber, 
      action, 
      title, 
      state, 
      merged, 
      baseBranch, 
      headBranch, 
      githubUrl 
    } = event.data;

    try {
      console.log(`🔍 Analyzing PR #${prNumber} for project ${projectId} (action: ${action}) - ${githubUrl}`);

      // Step 1: Analyze PR impact
      const analysis: PRAnalysis = await step.run<PRAnalysis>("analyze-pr-impact", async () => {
        // This is where you could implement PR analysis logic
        // You could use githubUrl to make API calls like:
        // - GET ${githubUrl}/pulls/${prNumber} for detailed PR info
        // - GET ${githubUrl}/pulls/${prNumber}/files for affected files
        // - GET ${githubUrl}/pulls/${prNumber}.diff for code changes
        // For now, we'll create a basic analysis structure
        return {
          prNumber,
          action,
          title,
          state,
          merged,
          baseBranch,
          headBranch,
          githubUrl,
          riskLevel: 'medium' as const, // Could be calculated based on changes
          affectedFiles: [], // Could be extracted from PR diff
          recommendations: []
        };
      });

      // Step 2: Store PR analysis (if you have a PRAnalysis table)
      await step.run<PRAnalysis>("store-analysis", async () => {
        // You could store PR analysis results in the database here
        console.log(`PR analysis completed for #${prNumber}:`, analysis);
        return analysis;
      });

      return { success: true as const, projectId, analysis } as const;

    } catch (error) {
      console.error(`❌ PR analysis failed for project ${projectId}, PR #${prNumber}:`, error);
      throw error;
    }
  }
);