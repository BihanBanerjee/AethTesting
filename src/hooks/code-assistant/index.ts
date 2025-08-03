export { useCodeAssistant } from './use-code-assistant';
export { useCodeAssistantComposition } from './use-code-assistant-composition';
export { useCodeGeneration } from './use-code-generation';
export { useMessageManagement } from './use-message-management';
export { useFileSelection } from './use-file-selection';
export { useProcessingStates } from './use-processing-states';
export { useAPIRouting } from './use-api-routing';
export { extractResponseContent, extractResponseMetadata } from '../utils/response-processors';
export type {
  MessageManagementState,
  FileSelectionState,
  ProcessingState,
  APIRoutingState,
  ProjectContextData,
  CodeAssistantHookReturn
} from '../types/use-code-assistant.types';
export type { 
  CodeAssistantComposition,
  EnhancedCodeAssistantComposition 
} from './use-code-assistant-composition';
export type {
  CodeGenerationHook,
  GenerationRequest,
  GenerationResult
} from './use-code-generation';