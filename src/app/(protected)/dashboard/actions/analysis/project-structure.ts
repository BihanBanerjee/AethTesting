// src/app/(protected)/dashboard/actions/analysis/project-structure.ts
import type { DatabaseFile, ProjectStructure } from '../types/action-types';

export function buildProjectStructure(files: DatabaseFile[]): string {
  const structure: ProjectStructure = {};
  
  files.forEach(file => {
    const parts = file.fileName.split('/');
    let current = structure;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        if (!current._files) current._files = [];
        current._files.push(part);
      } else {
        // It's a directory
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });
  
  return formatStructure(structure);
}

export function formatStructure(obj: ProjectStructure, indent = 0): string {
  let result = '';
  const spaces = '  '.repeat(indent);
  
  Object.keys(obj).forEach(key => {
    if (key === '_files') {
      const files = obj[key] as string[];
      files.slice(0, 5).forEach((file: string) => {
        result += `${spaces}${file}\n`;
      });
      if (files.length > 5) {
        result += `${spaces}... and ${files.length - 5} more files\n`;
      }
    } else {
      result += `${spaces}${key}/\n`;
      result += formatStructure(obj[key], indent + 1);
    }
  });
  
  return result;
}