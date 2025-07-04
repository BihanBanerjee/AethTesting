// src/lib/diff-generator.ts
import { diffLines, diffWords, createTwoFilesPatch } from 'diff';

export interface FileDiff {
  fileName: string;
  originalContent: string;
  modifiedContent: string;
  unifiedDiff: string;
  hunks: DiffHunk[];
  stats: DiffStats;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber: {
    old?: number;
    new?: number;
  };
}

export interface DiffStats {
  insertions: number;
  deletions: number;
  totalChanges: number;
}

export class DiffGenerator {
  
  generateFileDiff(
    fileName: string, 
    originalContent: string, 
    modifiedContent: string
  ): FileDiff {
    // Generate unified diff
    const unifiedDiff = createTwoFilesPatch(
      fileName,
      fileName,
      originalContent,
      modifiedContent,
      'original',
      'modified'
    );

    // Generate line-by-line diff for detailed analysis
    const lineDiff = diffLines(originalContent, modifiedContent);
    const hunks = this.generateHunks(lineDiff);
    const stats = this.calculateStats(lineDiff);

    return {
      fileName,
      originalContent,
      modifiedContent,
      unifiedDiff,
      hunks,
      stats
    };
  }

  generateMultiFileDiff(files: Array<{
    fileName: string;
    originalContent: string;
    modifiedContent: string;
  }>): FileDiff[] {
    return files.map(file => 
      this.generateFileDiff(file.fileName, file.originalContent, file.modifiedContent)
    );
  }

  private generateHunks(lineDiff: any[]): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let oldLineNumber = 1;
    let newLineNumber = 1;

    for (const part of lineDiff) {
      const lines = part.value.split('\n').filter((line: string) => line !== '');
      
      if (part.added || part.removed) {
        // Start a new hunk if needed
        if (!currentHunk) {
          currentHunk = {
            oldStart: oldLineNumber,
            oldLines: 0,
            newStart: newLineNumber,
            newLines: 0,
            lines: []
          };
        }

        // Add lines to current hunk
        for (const line of lines) {
          if (part.added) {
            currentHunk.lines.push({
              type: 'add',
              content: line,
              lineNumber: { new: newLineNumber++ }
            });
            currentHunk.newLines++;
          } else {
            currentHunk.lines.push({
              type: 'remove',
              content: line,
              lineNumber: { old: oldLineNumber++ }
            });
            currentHunk.oldLines++;
          }
        }
      } else {
        // Context lines
        if (currentHunk) {
          // Add some context and close the hunk
          const contextLines = Math.min(3, lines.length);
          for (let i = 0; i < contextLines; i++) {
            currentHunk.lines.push({
              type: 'context',
              content: lines[i],
              lineNumber: { old: oldLineNumber++, new: newLineNumber++ }
            });
          }
          hunks.push(currentHunk);
          currentHunk = null;
        }
        
        // Skip most context lines but keep track of line numbers
        oldLineNumber += lines.length;
        newLineNumber += lines.length;
      }
    }

    // Close any remaining hunk
    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  private calculateStats(lineDiff: any[]): DiffStats {
    let insertions = 0;
    let deletions = 0;

    for (const part of lineDiff) {
      const lineCount = part.value.split('\n').filter((line: string) => line !== '').length;
      
      if (part.added) {
        insertions += lineCount;
      } else if (part.removed) {
        deletions += lineCount;
      }
    }

    return {
      insertions,
      deletions,
      totalChanges: insertions + deletions
    };
  }

  // Smart diff that considers semantic meaning
  generateSemanticDiff(
    fileName: string,
    originalContent: string,
    modifiedContent: string
  ): SemanticDiff {
    const standardDiff = this.generateFileDiff(fileName, originalContent, modifiedContent);
    
    // Analyze the types of changes
    const changeTypes = this.analyzeChangeTypes(originalContent, modifiedContent);
    const impactAnalysis = this.analyzeChangeImpact(originalContent, modifiedContent);
    
    return {
      ...standardDiff,
      changeTypes,
      impactAnalysis,
      recommendations: this.generateRecommendations(changeTypes, impactAnalysis)
    };
  }

  private analyzeChangeTypes(original: string, modified: string): ChangeType[] {
    const types: ChangeType[] = [];
    
    // Function additions/removals
    const originalFunctions = this.extractFunctions(original);
    const modifiedFunctions = this.extractFunctions(modified);
    
    const addedFunctions = modifiedFunctions.filter(f => 
      !originalFunctions.some(of => of.name === f.name)
    );
    const removedFunctions = originalFunctions.filter(f => 
      !modifiedFunctions.some(mf => mf.name === f.name)
    );
    
    if (addedFunctions.length > 0) {
      types.push({
        type: 'function_addition',
        count: addedFunctions.length,
        items: addedFunctions.map(f => f.name)
      });
    }
    
    if (removedFunctions.length > 0) {
      types.push({
        type: 'function_removal',
        count: removedFunctions.length,
        items: removedFunctions.map(f => f.name)
      });
    }

    // Import/export changes
    const originalImports = this.extractImports(original);
    const modifiedImports = this.extractImports(modified);
    
    if (originalImports.length !== modifiedImports.length) {
      types.push({
        type: 'dependency_change',
        count: Math.abs(originalImports.length - modifiedImports.length),
        items: []
      });
    }

    return types;
  }

  private analyzeChangeImpact(original: string, modified: string): ImpactAnalysis {
    return {
      riskLevel: this.calculateRiskLevel(original, modified),
      affectedAreas: this.identifyAffectedAreas(original, modified),
      breakingChanges: this.detectBreakingChanges(original, modified),
      testingRequired: this.assessTestingNeeds(original, modified)
    };
  }

  private calculateRiskLevel(original: string, modified: string): 'low' | 'medium' | 'high' {
    const stats = this.calculateStats(diffLines(original, modified));
    const changePercentage = stats.totalChanges / original.split('\n').length;
    
    if (changePercentage > 0.5) return 'high';
    if (changePercentage > 0.2) return 'medium';
    return 'low';
  }

  private identifyAffectedAreas(original: string, modified: string): string[] {
    const areas: string[] = [];
    
    // Check for API changes
    if (original.includes('export') && modified.includes('export')) {
      const originalExports = this.extractExports(original);
      const modifiedExports = this.extractExports(modified);
      
      if (originalExports.length !== modifiedExports.length) {
        areas.push('public_api');
      }
    }
    
    // Check for database schema changes
    if (original.includes('schema') || original.includes('model')) {
      areas.push('database_schema');
    }
    
    // Check for configuration changes
    if (original.includes('config') || original.includes('env')) {
      areas.push('configuration');
    }
    
    return areas;
  }

  private detectBreakingChanges(original: string, modified: string): BreakingChange[] {
    const breakingChanges: BreakingChange[] = [];
    
    // Function signature changes
    const originalFunctions = this.extractFunctions(original);
    const modifiedFunctions = this.extractFunctions(modified);
    
    for (const originalFunc of originalFunctions) {
      const modifiedFunc = modifiedFunctions.find(f => f.name === originalFunc.name);
      if (modifiedFunc && originalFunc.signature !== modifiedFunc.signature) {
        breakingChanges.push({
          type: 'function_signature_change',
          item: originalFunc.name,
          description: `Function signature changed from "${originalFunc.signature}" to "${modifiedFunc.signature}"`
        });
      }
    }
    
    return breakingChanges;
  }

  private assessTestingNeeds(original: string, modified: string): TestingRequirement[] {
    const requirements: TestingRequirement[] = [];
    
    const stats = this.calculateStats(diffLines(original, modified));
    
    if (stats.totalChanges > 10) {
      requirements.push({
        type: 'integration_testing',
        priority: 'high',
        reason: 'Significant code changes detected'
      });
    }
    
    if (original.includes('async') || modified.includes('async')) {
      requirements.push({
        type: 'async_testing',
        priority: 'medium',
        reason: 'Asynchronous operations detected'
      });
    }
    
    return requirements;
  }

  private generateRecommendations(
    changeTypes: ChangeType[], 
    impact: ImpactAnalysis
  ): string[] {
    const recommendations: string[] = [];
    
    if (impact.riskLevel === 'high') {
      recommendations.push('Consider breaking this change into smaller, incremental updates');
      recommendations.push('Ensure comprehensive testing before deployment');
    }
    
    if (changeTypes.some(ct => ct.type === 'function_removal')) {
      recommendations.push('Verify that removed functions are not used elsewhere in the codebase');
    }
    
    if (impact.affectedAreas.includes('public_api')) {
      recommendations.push('Update API documentation and notify consumers of changes');
    }
    
    return recommendations;
  }

  private extractFunctions(code: string): Array<{name: string, signature: string}> {
    const functions: Array<{name: string, signature: string}> = [];
    
    // Simple regex-based function extraction
    const functionRegex = /(?:function\s+(\w+)\s*\([^)]*\)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>|(\w+)\s*\([^)]*\)\s*{)/g;
    let match;
    
    while ((match = functionRegex.exec(code)) !== null) {
      const name = match[1] || match[2] || match[3];
      const signature = match[0];
      if (name) {
        functions.push({ name, signature });
      }
    }
    
    return functions;
  }

  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private extractExports(code: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(code)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }
}

interface SemanticDiff extends FileDiff {
  changeTypes: ChangeType[];
  impactAnalysis: ImpactAnalysis;
  recommendations: string[];
}

interface ChangeType {
  type: 'function_addition' | 'function_removal' | 'function_modification' | 'dependency_change';
  count: number;
  items: string[];
}

interface ImpactAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  affectedAreas: string[];
  breakingChanges: BreakingChange[];
  testingRequired: TestingRequirement[];
}

interface BreakingChange {
  type: string;
  item: string;
  description: string;
}

interface TestingRequirement {
  type: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}