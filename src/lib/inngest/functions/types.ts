export type ProjectStatus = 
  | "INITIALIZING" 
  | "LOADING_REPO"
  | "INDEXING_REPO" 
  | "POLLING_COMMITS" 
  | "DEDUCTING_CREDITS" 
  | "COMPLETED" 
  | "FAILED";

export type MeetingStatus = 
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";