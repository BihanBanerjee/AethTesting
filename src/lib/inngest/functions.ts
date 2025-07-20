// Re-export all functions from the modularized structure
export {
  processProjectCreation,
  processSingleCommit,
  processSmartReindexing,
  processFileChanges,
  analyzePullRequest,
  processRelease,
  processMeetingFunction,
  functions,
  type ProjectStatus,
  type MeetingStatus
} from "./functions/index";