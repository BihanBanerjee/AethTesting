// Release event processing
import { inngest } from "@/lib/inngest/client";
import type { WebhookPayload, Project } from "../types";

export async function handleReleaseEvent(payload: WebhookPayload, projects: Project[]): Promise<void> {
  console.log(`Processing release event: ${payload.action}`);
  
  if (!payload.release) {
    console.warn('Release event missing release data');
    return;
  }
  
  // Handle release events for documentation updates
  for (const project of projects) {
    await inngest.send({
      name: "project.release.analysis.requested",
      data: {
        projectId: project.id,
        releaseAction: payload.action,
        releaseName: payload.release.name,
        releaseTag: payload.release.tag_name,
        githubUrl: payload.repository.html_url
      }
    });
  }
}