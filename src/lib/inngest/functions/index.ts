// Project functions
export { processProjectCreation } from "./project/creation";
export { processSingleCommit } from "./project/commit-processing";
export { processSmartReindexing } from "./project/reindexing";

// Webhook functions
export { processFileChanges } from "./webhooks/file-changes";
export { analyzePullRequest } from "./webhooks/pull-requests";
export { processRelease } from "./webhooks/releases";

// Meeting functions
export { processMeetingFunction } from "./meetings/processing";

// Types
export type { ProjectStatus, MeetingStatus } from "./types";

// Export all functions in a flat array for Inngest registration
import { processProjectCreation } from "./project/creation";
import { processSingleCommit } from "./project/commit-processing";
import { processSmartReindexing } from "./project/reindexing";
import { processFileChanges } from "./webhooks/file-changes";
import { analyzePullRequest } from "./webhooks/pull-requests";
import { processRelease } from "./webhooks/releases";
import { processMeetingFunction } from "./meetings/processing";

export const functions = [
  // Project Creation
  processProjectCreation, 
  processSingleCommit,
  
  // Webhook-triggered functions
  processSmartReindexing,
  processFileChanges,
  analyzePullRequest,
  processRelease,
  
  // Meeting Processing
  processMeetingFunction
];