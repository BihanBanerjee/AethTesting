// Re-export all modularized hooks for backward compatibility
export {
  useCodeAssistant,
  useMessageManagement,
  useFileSelection,
  useProcessingStates,
  useAPIRouting,
  extractResponseContent,
  extractResponseMetadata
} from './code-assistant';

export type {
  MessageManagementState,
  FileSelectionState,
  ProcessingState,
  APIRoutingState,
  ProjectContextData,
  CodeAssistantHookReturn
} from './code-assistant';