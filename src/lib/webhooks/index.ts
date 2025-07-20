// Main webhook orchestrator - re-exports and convenience functions
export * from './types';
export * from './signature-verification';
export * from './database-operations';
export * from './reindexing-logic';

// Event processors
export { handlePushEvent } from './event-processors/push-events';
export { handlePullRequestEvent } from './event-processors/pull-request-events';
export { handleRepositoryEvent } from './event-processors/repository-events';
export { handleReleaseEvent } from './event-processors/release-events';

// Main webhook processor class for backward compatibility
import { handlePushEvent } from './event-processors/push-events';
import { handlePullRequestEvent } from './event-processors/pull-request-events';
import { handleRepositoryEvent } from './event-processors/repository-events';
import { handleReleaseEvent } from './event-processors/release-events';
import { getProjectsForRepository } from './database-operations';
import type { WebhookPayload, Project } from './types';

export class WebhookProcessor {
  static async handlePushEvent(payload: WebhookPayload, projects: Project[]) {
    return handlePushEvent(payload, projects);
  }

  static async handlePullRequestEvent(payload: WebhookPayload, projects: Project[]) {
    return handlePullRequestEvent(payload, projects);
  }

  static async handleRepositoryEvent(payload: WebhookPayload, projects: Project[]) {
    return handleRepositoryEvent(payload, projects);
  }

  static async handleReleaseEvent(payload: WebhookPayload, projects: Project[]) {
    return handleReleaseEvent(payload, projects);
  }

  static async getProjectsForRepository(githubUrl: string) {
    return getProjectsForRepository(githubUrl);
  }
}