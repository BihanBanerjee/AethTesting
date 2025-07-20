// Repository event processing
import { db } from "@/server/db";
import type { WebhookPayload, Project } from "../types";

export async function handleRepositoryEvent(payload: WebhookPayload, projects: Project[]): Promise<void> {
  console.log(`Processing repository event: ${payload.action}`);
  
  // Handle repository events like branch creation, deletion, etc.
  if (payload.action === 'deleted') {
    // Archive projects associated with deleted repository
    for (const project of projects) {
      await db.project.update({
        where: { id: project.id },
        data: { deletedAt: new Date() }
      });
    }
  }
}