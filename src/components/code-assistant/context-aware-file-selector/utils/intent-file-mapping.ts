import type { IntentType } from '../types';

export const getFilesForIntent = (intentType: IntentType, files: string[], query: string): string[] => {
  const relevantFiles: string[] = [];
  
  switch (intentType) {
    case 'code_generation':
      // Suggest component files, utils, and similar patterns
      relevantFiles.push(...files.filter(f => 
        f.includes('components/') || 
        f.includes('utils/') || 
        f.includes('lib/') ||
        f.includes('hooks/')
      ));
      break;
      
    case 'debug':
      // Suggest files that commonly have bugs
      relevantFiles.push(...files.filter(f => 
        f.includes('api/') || 
        f.includes('server/') ||
        f.includes('database/') ||
        f.includes('auth/')
      ));
      break;
      
    case 'code_review':
      // Suggest core business logic files
      relevantFiles.push(...files.filter(f => 
        f.includes('src/') && 
        (f.endsWith('.ts') || f.endsWith('.tsx')) &&
        !f.includes('test') &&
        !f.includes('spec')
      ));
      break;
      
    case 'refactor':
      // Suggest larger, complex files
      relevantFiles.push(...files.filter(f => 
        f.includes('pages/') || 
        f.includes('components/') ||
        f.includes('services/')
      ));
      break;
      
    case 'explain':
      // Suggest documentation and core files
      relevantFiles.push(...files.filter(f => 
        f.includes('README') ||
        f.includes('docs/') ||
        f.includes('src/') && !f.includes('test')
      ));
      break;
      
    case 'question':
      // Suggest relevant files based on query keywords
      const keywords = query.toLowerCase().split(' ');
      relevantFiles.push(...files.filter(f => 
        keywords.some(keyword => f.toLowerCase().includes(keyword))
      ));
      break;
  }
  
  return relevantFiles.slice(0, 3);
};

export const filterFilesBySearch = (files: string[], searchTerm: string): string[] => {
  if (!searchTerm.trim()) return files;
  
  const term = searchTerm.toLowerCase();
  return files.filter(file => 
    file.toLowerCase().includes(term) ||
    file.split('/').pop()?.toLowerCase().includes(term)
  );
};

export const getFileDisplayName = (filePath: string): string => {
  return filePath.split('/').pop() || filePath;
};