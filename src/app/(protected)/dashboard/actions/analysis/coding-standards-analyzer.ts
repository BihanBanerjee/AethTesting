// src/app/(protected)/dashboard/actions/analysis/coding-standards-analyzer.ts
import type { DatabaseFile, CodingStandards } from '../types/action-types';

export function analyzeCodingStandards(files: DatabaseFile[]): CodingStandards {
  let totalIndentationSpaces = 0;
  let indentationSamples = 0;
  let singleQuotes = 0;
  let doubleQuotes = 0;
  let semicolons = 0;
  let noSemicolons = 0;
  
  files.slice(0, 20).forEach(file => { // Sample first 20 files
    const content = typeof file.sourceCode === 'string' ? file.sourceCode : JSON.stringify(file.sourceCode);
    const lines = content.split('\n');
    
    lines.forEach(line => {
      // Analyze indentation
      const match = line.match(/^( +)/);
      if (match && match[1]) {
        totalIndentationSpaces += match[1].length;
        indentationSamples++;
      }
      
      // Analyze quotes
      const singleQuoteMatches = (line.match(/'/g) || []).length;
      const doubleQuoteMatches = (line.match(/"/g) || []).length;
      singleQuotes += singleQuoteMatches;
      doubleQuotes += doubleQuoteMatches;
      
      // Analyze semicolons
      if (line.trim().endsWith(';')) semicolons++;
      if (line.trim().length > 0 && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        noSemicolons++;
      }
    });
  });
  
  const avgIndentation = indentationSamples > 0 ? Math.round(totalIndentationSpaces / indentationSamples) : 2;
  
  return {
    indentation: avgIndentation === 4 ? '4 spaces' : '2 spaces',
    quotes: singleQuotes > doubleQuotes ? 'single' : 'double',
    semicolons: semicolons > noSemicolons,
    estimatedLineLength: 100 // Default assumption
  };
}

