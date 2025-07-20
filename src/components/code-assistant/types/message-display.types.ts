import type { Message } from '@/types/code-assistant';

export interface MessageDisplayProps {
  message: Message;
}

export interface MessageHeaderProps {
  intent?: string;
  confidence?: number;
  timestamp: Date;
}

export interface GeneratedCodeSectionProps {
  generatedCode: string;
  language?: string;
  intent?: string;
  onCopy: (text: string) => void;
  onDownload: (code: string, filename: string) => void;
}

export interface DiffDisplaySectionProps {
  diff: {
    original: string;
    modified: string;
    filename: string;
  };
}

export interface SuggestionsSectionProps {
  suggestions: Array<{
    type: 'improvement' | 'bug_fix' | 'optimization' | 'security';
    description: string;
    code?: string;
  }>;
}

export interface FileReferencesSectionProps {
  files: string[];
}

export interface ActionButtonsProps {
  onCopy: () => void;
  onDownload: () => void;
}

export interface MessageContainerProps {
  type: 'user' | 'assistant';
  children: React.ReactNode;
}