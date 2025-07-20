// Pull request event processing
import { inngest } from "@/lib/inngest/client";
import type { WebhookPayload, Project } from "../types";

export async function handlePullRequestEvent(payload: WebhookPayload, projects: Project[]): Promise<void> {
  console.log(`Processing pull request event: ${payload.action}`);
  
  if (!payload.pull_request) {
    console.warn('Pull request event missing pull_request data');
    return;
  }
  
  for (const project of projects) {
    await inngest.send({
      name: "pullrequest.analysis.requested",
      data: {
        projectId: project.id,
        prNumber: payload.pull_request.number,
        action: payload.action,
        title: payload.pull_request.title,
        state: payload.pull_request.state,
        merged: payload.pull_request.merged,
        baseBranch: payload.pull_request.base.ref,
        headBranch: payload.pull_request.head.ref,
        githubUrl: payload.repository.html_url
      }
    });
  }
}