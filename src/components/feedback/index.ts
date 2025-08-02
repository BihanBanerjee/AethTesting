// Export new feedback components
export { RatingStars } from './rating-stars';
export { HelpfulToggle } from './helpful-toggle';
export { SatisfactionSlider } from './satisfaction-slider';
export { FeedbackModal } from './feedback-modal';

// Export existing components for backward compatibility
export {
  EnhancedSaveButton,
  SaveActionButtons,
  useSaveHandler,
  buildEnhancedMetadata,
  createEnhancedFileReferences
} from './enhanced-save';

export { FeedbackCollector } from './feedback-collector';

export type {
  EnhancedSaveButtonProps,
  EnhancedResponse,
  Project,
  SaveAnswerMutation,
  FileReference,
  EnhancedMetadata
} from './enhanced-save';