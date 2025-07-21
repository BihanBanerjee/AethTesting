// Frontend-only utilities for React components and browser APIs
/* eslint-disable @typescript-eslint/no-require-imports */
import type { IntentType } from './config';
import { getIntentEmoji } from './shared-utilities';

// React imports - only used in frontend functions
let ReactIcons: Record<string, React.ComponentType<{ className?: string }>> | null = null;
try {
  // Dynamically import React icons only when needed
   
  ReactIcons = require('lucide-react') as Record<string, React.ComponentType<{ className?: string }>>;
} catch {
  // Icons not available in backend context
}

// Map intent types to React icons - only works in frontend
const INTENT_ICON_MAP: Record<IntentType, string> = {
  code_generation: 'Code',
  code_improvement: 'Zap',
  code_review: 'Search',
  debug: 'Bug',
  refactor: 'Wrench',
  explain: 'Lightbulb',
  question: 'MessageSquare'
};

export const getIntentIcon = (intent?: string, className: string = "h-4 w-4"): string | React.ReactElement => {
  if (!ReactIcons) {
    // Return emoji fallback for backend
    return getIntentEmoji(intent);
  }
  
  const normalizedIntent = (intent as IntentType) || 'question';
  const iconName = INTENT_ICON_MAP[normalizedIntent] || 'MessageSquare';
  const IconComponent = ReactIcons[iconName];
  
  if (!IconComponent) {
    return getIntentEmoji(intent);
  }
  
  // Return React component for frontend
   
  const React = require('react') as typeof import('react');
  return React.createElement(IconComponent, { className });
};

export const copyToClipboard = (text: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
};

export const downloadCode = (code: string, filename: string) => {
  if (typeof window !== 'undefined') {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};