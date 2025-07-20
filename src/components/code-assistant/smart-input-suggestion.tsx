// Re-export all modularized components for backward compatibility
export {
  SmartInputSuggestions,
  SuggestionItem,
  useInputAnalysis,
  generateSuggestions,
  INTENT_ICONS
} from './smart-input';

export type {
  SmartInputSuggestionsProps,
  SuggestionPrediction,
  ProjectContext,
  QueryIntent
} from './smart-input';