// Main index - Re-export everything for backward compatibility
export * from './config';
export * from './shared-utilities';
export * from './frontend-utilities';
export * from './calculation-utilities';
export * from './statistics';

// Maintain the original module structure for easier migration
export { getIntentConfig, type IntentType, type IntentConfig } from './config';
export { getIntentColor, getIntentEmoji, getIntentLabel } from './shared-utilities';
export { getIntentIcon, copyToClipboard, downloadCode } from './frontend-utilities';
export { 
  calculateQuestionImpact, 
  getConfidenceLevel, 
  getSatisfactionLevel, 
  formatProcessingTime 
} from './calculation-utilities';
export { getQuestionStatistics } from './statistics';