import { Code, Zap, Search, Bug, Wrench, Lightbulb, Sparkles } from 'lucide-react';

export const INTENT_ICONS = {
  code_generation: <Code className="h-3 w-3" />,
  code_improvement: <Zap className="h-3 w-3" />,
  code_review: <Search className="h-3 w-3" />,
  debug: <Bug className="h-3 w-3" />,
  refactor: <Wrench className="h-3 w-3" />,
  explain: <Lightbulb className="h-3 w-3" />,
  file_specific: <Sparkles className="h-3 w-3" />,
  default: <Sparkles className="h-3 w-3" />
} as const;