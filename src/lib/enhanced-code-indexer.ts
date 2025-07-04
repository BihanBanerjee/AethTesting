// src/lib/enhanced-code-indexer.ts
import { Document } from "@langchain/core/documents";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as ts from "typescript";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";

interface CodeChunk {
  content: string;
  type: 'function' | 'class' | 'interface' | 'component' | 'hook' | 'util' | 'config';
  name: string;
  startLine: number;
  endLine: number;
  dependencies: string[];
  exports: string[];
  imports: string[];
}

interface FileAnalysis {
  fileName: string;
  language: string;
  chunks: CodeChunk[];
  dependencies: string[];
  exports: string[];
  imports: string[];
  complexity: number;
  maintainabilityIndex: number;
}

export class EnhancedCodeIndexer {
  
  async analyzeFile(doc: Document): Promise<FileAnalysis> {
    const fileName = doc.metadata.source;
    const content = doc.pageContent;
    const language = this.detectLanguage(fileName);
    
    try {
      switch (language) {
        case 'typescript':
        case 'javascript':
          return await this.analyzeJSTS(fileName, content);
        case 'python':
          return await this.analyzePython(fileName, content);
        default:
          return await this.analyzeGeneric(fileName, content);
      }
    } catch (error) {
      console.error(`Error analyzing ${fileName}:`, error);
      return this.analyzeGeneric(fileName, content);
    }
  }

  private async analyzeJSTS(fileName: string, content: string): Promise<FileAnalysis> {
    const chunks: CodeChunk[] = [];
    const dependencies: string[] = [];
    const exports: string[] = [];
    const imports: string[] = [];
    
    try {
      const ast = parser.parse(content, {
        sourceType: "module",
        plugins: [
          "typescript",
          "jsx",
          "decorators-legacy",
          "classProperties",
          "functionBind"
        ]
      });

      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          dependencies.push(source);
          imports.push(source);
        },
        
        ExportDefaultDeclaration(path) {
          exports.push('default');
        },
        
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            if (path.node.declaration.type === 'FunctionDeclaration') {
              exports.push(path.node.declaration.id?.name || 'anonymous');
            } else if (path.node.declaration.type === 'VariableDeclaration') {
              path.node.declaration.declarations.forEach(decl => {
                if (decl.id.type === 'Identifier') {
                  exports.push(decl.id.name);
                }
              });
            }
          }
        },

        FunctionDeclaration(path) {
          const name = path.node.id?.name || 'anonymous';
          const start = path.node.loc?.start.line || 0;
          const end = path.node.loc?.end.line || 0;
          
          chunks.push({
            content: content.split('\n').slice(start - 1, end).join('\n'),
            type: 'function',
            name,
            startLine: start,
            endLine: end,
            dependencies: this.extractDependencies(path),
            exports: [name],
            imports: []
          });
        },

        ClassDeclaration(path) {
          const name = path.node.id?.name || 'anonymous';
          const start = path.node.loc?.start.line || 0;
          const end = path.node.loc?.end.line || 0;
          
          chunks.push({
            content: content.split('\n').slice(start - 1, end).join('\n'),
            type: 'class',
            name,
            startLine: start,
            endLine: end,
            dependencies: this.extractDependencies(path),
            exports: [name],
            imports: []
          });
        },

        // React component detection
        VariableDeclarator(path) {
          if (path.node.init?.type === 'ArrowFunctionExpression' ||
              path.node.init?.type === 'FunctionExpression') {
            const name = path.node.id.type === 'Identifier' ? path.node.id.name : 'anonymous';
            
            // Check if it's likely a React component
            if (this.isReactComponent(name, path)) {
              const start = path.node.loc?.start.line || 0;
              const end = path.node.loc?.end.line || 0;
              
              chunks.push({
                content: content.split('\n').slice(start - 1, end).join('\n'),
                type: 'component',
                name,
                startLine: start,
                endLine: end,
                dependencies: this.extractDependencies(path),
                exports: [name],
                imports: []
              });
            }
          }
        }
      });

    } catch (parseError) {
      console.warn(`Failed to parse ${fileName}, falling back to generic analysis`);
      return this.analyzeGeneric(fileName, content);
    }

    const complexity = this.calculateComplexity(content);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(content, complexity);

    return {
      fileName,
      language: 'typescript',
      chunks,
      dependencies,
      exports,
      imports,
      complexity,
      maintainabilityIndex
    };
  }

  private async analyzePython(fileName: string, content: string): Promise<FileAnalysis> {
    // For Python, we'd use a Python AST parser or call a Python service
    // For now, implement basic regex-based analysis
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');
    
    // Simple function detection
    const functionRegex = /^def\s+(\w+)\s*\(/;
    const classRegex = /^class\s+(\w+).*:/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const functionMatch = line?.match(functionRegex);
      const classMatch = line?.match(classRegex);
      
      if (functionMatch) {
        const name = functionMatch[1] ?? 'anonymous';
        const endLine = this.findPythonBlockEnd(lines, i);
        chunks.push({
          content: lines.slice(i, endLine + 1).join('\n'),
          type: 'function',
          name,
          startLine: i + 1,
          endLine: endLine + 1,
          dependencies: [],
          exports: [name],
          imports: []
        });
      } else if (classMatch) {
        const name = classMatch[1];
        const endLine = this.findPythonBlockEnd(lines, i);
        chunks.push({
          content: lines.slice(i, endLine + 1).join('\n'),
          type: 'class',
          name,
          startLine: i + 1,
          endLine: endLine + 1,
          dependencies: [],
          exports: [name],
          imports: []
        });
      }
    }

    return {
      fileName,
      language: 'python',
      chunks,
      dependencies: this.extractPythonImports(content),
      exports: chunks.map(c => c.name),
      imports: this.extractPythonImports(content),
      complexity: this.calculateComplexity(content),
      maintainabilityIndex: this.calculateMaintainabilityIndex(content, this.calculateComplexity(content))
    };
  }

  private async analyzeGeneric(fileName: string, content: string): Promise<FileAnalysis> {
    return {
      fileName,
      language: this.detectLanguage(fileName),
      chunks: [{
        content,
        type: 'util',
        name: fileName.split('/').pop() || fileName,
        startLine: 1,
        endLine: content.split('\n').length,
        dependencies: [],
        exports: [],
        imports: []
      }],
      dependencies: [],
      exports: [],
      imports: [],
      complexity: this.calculateComplexity(content),
      maintainabilityIndex: this.calculateMaintainabilityIndex(content, this.calculateComplexity(content))
    };
  }

  private detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c'
    };
    return langMap[ext || ''] || 'text';
  }

  private isReactComponent(name: string, path: any): boolean {
    return /^[A-Z]/.test(name) && this.containsJSX(path);
  }

  private containsJSX(path: any): boolean {
    let hasJSX = false;
    path.traverse({
      JSXElement() {
        hasJSX = true;
        path.stop();
      }
    });
    return hasJSX;
  }

  private extractDependencies(path: any): string[] {
    const deps: string[] = [];
    path.traverse({
      Identifier(innerPath: any) {
        if (innerPath.isReferencedIdentifier()) {
          deps.push(innerPath.node.name);
        }
      }
    });
    return [...new Set(deps)];
  }

  private extractPythonImports(content: string): string[] {
    const imports: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const importMatch = line.match(/^(?:from\s+(\w+(?:\.\w+)*)\s+)?import\s+(.+)/);
      if (importMatch) {
        if (importMatch[1]) {
          imports.push(importMatch[1]);
        }
        // Parse imported names
        const importedNames = importMatch[2].split(',').map(name => name.trim());
        imports.push(...importedNames);
      }
    }
    
    return imports;
  }

  private findPythonBlockEnd(lines: string[], startIndex: number): number {
    const startIndentation = lines[startIndex].search(/\S/);
    
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      
      const currentIndentation = line.search(/\S/);
      if (currentIndentation <= startIndentation) {
        return i - 1;
      }
    }
    
    return lines.length - 1;
  }

  private calculateComplexity(content: string): number {
    // Simple cyclomatic complexity calculation
    const complexityKeywords = [
      'if', 'else', 'elif', 'while', 'for', 'switch', 'case', 
      '&&', '||', '?', 'catch', 'finally'
    ];
    
    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  private calculateMaintainabilityIndex(content: string, complexity: number): number {
    const linesOfCode = content.split('\n').filter(line => line.trim().length > 0).length;
    const halsteadVolume = Math.log2(linesOfCode) * linesOfCode; // Simplified
    
    // Simplified maintainability index formula
    const maintainabilityIndex = Math.max(0, 
      (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) * 100 / 171
    );
    
    return Math.round(maintainabilityIndex * 100) / 100;
  }

  async indexEnhancedFile(projectId: string, analysis: FileAnalysis): Promise<void> {
    // Store file-level analysis
    const fileEmbedding = await generateEmbedding(
      `File: ${analysis.fileName}\nLanguage: ${analysis.language}\nComplexity: ${analysis.complexity}\nExports: ${analysis.exports.join(', ')}\nImports: ${analysis.imports.join(', ')}`
    );
    
    await db.sourceCodeEmbedding.create({
      data: {
        fileName: analysis.fileName,
        sourceCode: JSON.stringify({
          language: analysis.language,
          dependencies: analysis.dependencies,
          exports: analysis.exports,
          imports: analysis.imports,
          complexity: analysis.complexity,
          maintainabilityIndex: analysis.maintainabilityIndex
        }),
        summary: `${analysis.language} file with ${analysis.chunks.length} code chunks. Complexity: ${analysis.complexity}. Exports: ${analysis.exports.join(', ')}`,
        projectId
      }
    });

    // Store chunk-level analysis
    for (const chunk of analysis.chunks) {
      const chunkSummary = await summariseCode({
        pageContent: chunk.content,
        metadata: { 
          source: `${analysis.fileName}:${chunk.name}`,
          type: chunk.type,
          startLine: chunk.startLine,
          endLine: chunk.endLine
        }
      } as Document);
      
      const chunkEmbedding = await generateEmbedding(chunkSummary);
      
      await db.sourceCodeEmbedding.create({
        data: {
          fileName: `${analysis.fileName}:${chunk.name}`,
          sourceCode: JSON.stringify({
            content: chunk.content,
            type: chunk.type,
            dependencies: chunk.dependencies,
            exports: chunk.exports,
            startLine: chunk.startLine,
            endLine: chunk.endLine
          }),
          summary: chunkSummary,
          projectId
        }
      });
    }
  }
}