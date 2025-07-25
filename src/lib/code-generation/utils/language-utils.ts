// src/lib/code-generation/utils/language-utils.ts

interface FileData {
  fileName: string;
  sourceCode: string | object;
}

interface CodingStandards {
  indentation: string;
  quotes: string;
  semicolons: boolean;
  trailingCommas: boolean;
  maxLineLength: number;
}

export function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'md': 'markdown',
    'markdown': 'markdown',
    'json': 'json',
    'yml': 'yaml',
    'yaml': 'yaml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'php': 'php',
    'rb': 'ruby',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'sql': 'sql',
    'xml': 'xml',
    'txt': 'text'
  };
  return langMap[ext || ''] || 'text';
}

export function inferTechStack(files: FileData[]): string[] {
  const stack = new Set<string>();
  
  files.forEach(file => {
    const fileName = file.fileName.toLowerCase();
    const content = (typeof file.sourceCode === 'string' ? file.sourceCode : JSON.stringify(file.sourceCode)).toLowerCase();
    
    // Framework detection
    if (fileName.includes('next') || content.includes('next/')) stack.add('Next.js');
    if (content.includes('react')) stack.add('React');
    if (content.includes('vue')) stack.add('Vue.js');
    if (content.includes('angular')) stack.add('Angular');
    if (content.includes('svelte')) stack.add('Svelte');
    
    // Language detection
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) stack.add('TypeScript');
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) stack.add('JavaScript');
    if (fileName.endsWith('.py')) stack.add('Python');
    if (fileName.endsWith('.rs')) stack.add('Rust');
    if (fileName.endsWith('.go')) stack.add('Go');
    
    // Database
    if (content.includes('prisma')) stack.add('Prisma');
    if (content.includes('mongoose')) stack.add('MongoDB');
    if (content.includes('postgres') || content.includes('postgresql')) stack.add('PostgreSQL');
    if (content.includes('mysql')) stack.add('MySQL');
    
    // Styling
    if (content.includes('tailwind')) stack.add('Tailwind CSS');
    if (content.includes('styled-components')) stack.add('Styled Components');
    if (content.includes('emotion')) stack.add('Emotion');
    
    // State Management
    if (content.includes('redux')) stack.add('Redux');
    if (content.includes('zustand')) stack.add('Zustand');
    if (content.includes('recoil')) stack.add('Recoil');
    if (content.includes('jotai')) stack.add('Jotai');
  });
  
  return Array.from(stack);
}

export function inferArchitecturePattern(files: FileData[]): string {
  const patterns = {
    mvc: 0,
    layered: 0,
    clean: 0,
    microservices: 0,
    component: 0
  };

  files.forEach(file => {
    const path = file.fileName.toLowerCase();
    
    if (path.includes('controller') || path.includes('model') || path.includes('view')) {
      patterns.mvc++;
    }
    if (path.includes('service') || path.includes('repository') || path.includes('domain')) {
      patterns.layered++;
    }
    if (path.includes('usecase') || path.includes('entity') || path.includes('adapter')) {
      patterns.clean++;
    }
    if (path.includes('api/') && path.includes('route')) {
      patterns.microservices++;
    }
    if (path.includes('component') || path.includes('hook')) {
      patterns.component++;
    }
  });

  const dominantPattern = Object.entries(patterns).reduce((a, b) => 
    patterns[a[0] as keyof typeof patterns] > patterns[b[0] as keyof typeof patterns] ? a : b
  );

  return dominantPattern[0];
}

export function inferCodingStandards(): CodingStandards {
  return {
    indentation: '2 spaces',
    quotes: 'single',
    semicolons: true,
    trailingCommas: true,
    maxLineLength: 100
  };
}