// Shared intent configuration - single source of truth
export type IntentType = 
  | 'code_generation' 
  | 'debug' 
  | 'code_review' 
  | 'explain' 
  | 'code_improvement' 
  | 'refactor' 
  | 'question';

export interface IntentConfig {
  emoji: string;
  colorClasses: string;
  impactScore: number;
  label: string;
}

export const INTENT_CONFIGS: Record<IntentType, IntentConfig> = {
  code_generation: {
    emoji: '🔧',
    colorClasses: 'bg-green-500/20 text-green-200 border-green-500/30',
    impactScore: 10,
    label: 'Code Generation'
  },
  debug: {
    emoji: '🐛',
    colorClasses: 'bg-red-500/20 text-red-200 border-red-500/30',
    impactScore: 8,
    label: 'Debug'
  },
  code_review: {
    emoji: '👀',
    colorClasses: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    impactScore: 6,
    label: 'Code Review'
  },
  explain: {
    emoji: '💡',
    colorClasses: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
    impactScore: 4,
    label: 'Explain'
  },
  code_improvement: {
    emoji: '⚡',
    colorClasses: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    impactScore: 7,
    label: 'Code Improvement'
  },
  refactor: {
    emoji: '🔄',
    colorClasses: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
    impactScore: 7,
    label: 'Refactor'
  },
  question: {
    emoji: '❓',
    colorClasses: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
    impactScore: 3,
    label: 'Question'
  }
};

// Helper functions for safe access
export const getIntentConfig = (intent: string | null | undefined): IntentConfig => {
  const normalizedIntent = intent as IntentType;
  return INTENT_CONFIGS[normalizedIntent] || INTENT_CONFIGS.question;
};

