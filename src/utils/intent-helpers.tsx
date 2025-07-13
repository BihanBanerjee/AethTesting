import { 
  Code, 
  Zap, 
  Search, 
  Bug, 
  Wrench, 
  Lightbulb, 
  MessageSquare 
} from 'lucide-react';

export const getIntentIcon = (intent?: string) => {
  switch (intent) {
    case 'code_generation': return <Code className="h-4 w-4" />;
    case 'code_improvement': return <Zap className="h-4 w-4" />;
    case 'code_review': return <Search className="h-4 w-4" />;
    case 'debug': return <Bug className="h-4 w-4" />;
    case 'refactor': return <Wrench className="h-4 w-4" />;
    case 'explain': return <Lightbulb className="h-4 w-4" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
};

export const getIntentColor = (intent?: string) => {
  switch (intent) {
    case 'code_generation': return 'bg-green-500/20 text-green-200 border-green-500/30';
    case 'code_improvement': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    case 'code_review': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
    case 'debug': return 'bg-red-500/20 text-red-200 border-red-500/30';
    case 'refactor': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
    case 'explain': return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30';
    default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
  }
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  // Note: toast is imported in the component that calls this
};

export const downloadCode = (code: string, filename: string) => {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
