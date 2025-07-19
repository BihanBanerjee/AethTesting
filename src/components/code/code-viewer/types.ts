import type { CodeSuggestion } from '../shared/types';

export interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
  diff?: {
    type: 'addition' | 'deletion' | 'modification';
    originalCode?: string;
  };
  actions?: {
    copy?: boolean;
    download?: boolean;
    run?: boolean;
    apply?: boolean;
    preview?: boolean;
  };
  onApply?: () => Promise<void>;
  onPreview?: () => void;
  suggestions?: CodeSuggestion[];
}

export type { CodeSuggestion };