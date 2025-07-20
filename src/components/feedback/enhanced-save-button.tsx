// Re-export all modularized components for backward compatibility
export {
  EnhancedSaveButton,
  SaveActionButtons,
  useSaveHandler,
  buildEnhancedMetadata,
  createEnhancedFileReferences
} from './enhanced-save';

export type {
  EnhancedSaveButtonProps,
  EnhancedResponse,
  Project,
  SaveAnswerMutation,
  FileReference,
  EnhancedMetadata
} from './enhanced-save';