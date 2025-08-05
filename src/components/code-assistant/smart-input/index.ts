export { SmartInputSuggestions } from './smart-input-suggestions';
export { SuggestionItem } from '../components/suggestion-item';
export { useInputAnalysis } from '../hooks/use-input-analysis';
export { generateSuggestions } from '../utils/suggestion-generator';
export { INTENT_ICONS } from '../constants/suggestion-icons';
export type {
  SmartInputSuggestionsProps,
  SuggestionPrediction,
  ProjectContext
} from '../types/smart-input-suggestion.types';
export type { QueryIntent } from '@/lib/intent-classifier';