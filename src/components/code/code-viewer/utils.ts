import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export const getFileExtension = (lang: string): string => {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'py',
    rust: 'rs',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    css: 'css',
    html: 'html',
    json: 'json',
    yaml: 'yml',
    markdown: 'md'
  };
  return extensions[lang] || 'txt';
};

export const getDiffTypeColor = (type: string) => {
  switch (type) {
    case 'addition':
      return 'bg-green-500/20 text-green-200 border-green-500/30';
    case 'deletion':
      return 'bg-red-500/20 text-red-200 border-red-500/30';
    case 'modification':
      return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
    default:
      return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
  }
};

export const getSuggestionColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-500/20 text-red-200 border-red-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
  }
};

export const customSyntaxStyle = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '0.5rem',
    margin: 0,
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
  }
};