// src/lib/code-generation-engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/server/db";
import type { QueryIntent } from "./intent-classifier";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Use Pro for complex code generation

export interface CodeGenerationRequest {
  intent: QueryIntent;
  query: string;
  projectId: string;
  contextFiles?: string[];
  targetFile?: string;
  insertionPoint?: { line: number; column: number };
}

export interface CodeGenerationResult {
  type: 'new_file' | 'file_modification' | 'code_snippet' | 'multiple_files';
  files: GeneratedFile[];
  explanation: string;
  warnings?: string[];
  dependencies?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  changeType: 'create' | 'modify' | 'replace';
  diff?: string;
  insertionPoint?: { line: number; column: number };
}

export class CodeGenerationEngine {
  
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const { intent, query, projectId } = request;
    
    // Get project context
    const projectContext = await this.getProjectContext(projectId, intent.contextNeeded, request.contextFiles);
    
    switch (intent.type) {
      case 'code_generation':
        return await this.generateNewCode(request, projectContext);
      case 'code_improvement':
        return await this.improveCode(request, projectContext);
      case 'refactor':
        return await this.refactorCode(request, projectContext);
      case 'debug':
        return await this.debugCode(request, projectContext);
      default:
        throw new Error(`Unsupported intent type: ${intent.type}`);
    }
  }

  private async generateNewCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    const prompt = this.buildGenerationPrompt(request, context);
    
    try {
      const result = await model.generateContent([prompt]);
      const response = result.response.text();
      
      return this.parseCodeGenerationResponse(response, context);
    } catch (error) {
      console.error('Code generation failed:', error);
      throw new Error(`Code generation failed: ${error.message}`);
    }
  }

  private async improveCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    const targetFile = request.targetFile || request.contextFiles?.[0];
    if (!targetFile) {
      throw new Error('No target file specified for code improvement');
    }

    const fileContent = await this.getFileContent(targetFile, request.projectId);
    
    const prompt = `
You are an expert software engineer. Improve the following code based on the user's request.

User Request: "${request.query}"

Current Code (${targetFile}):
\`\`\`
${fileContent}
\`\`\`

Project Context:
${JSON.stringify(context, null, 2)}

Provide improvements focusing on:
1. Performance optimization
2. Code readability and maintainability
3. Best practices adherence
4. Security considerations
5. Type safety (if applicable)

Respond with ONLY a JSON object in this format:
{
  "type": "file_modification",
  "files": [{
    "path": "${targetFile}",
    "content": "improved code here",
    "language": "typescript",
    "changeType": "modify",
    "diff": "unified diff format"
  }],
  "explanation": "Detailed explanation of improvements made",
  "warnings": ["Any potential issues or considerations"],
  "dependencies": ["new dependencies if any"]
}
`;

    const result = await model.generateContent([prompt]);
    const response = result.response.text();
    
    return this.parseCodeGenerationResponse(response, context);
  }

  private async refactorCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    // Similar to improveCode but focused on structural changes
    const prompt = this.buildRefactorPrompt(request, context);
    
    const result = await model.generateContent([prompt]);
    const response = result.response.text();
    
    return this.parseCodeGenerationResponse(response, context);
  }

  private async debugCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
    const prompt = this.buildDebugPrompt(request, context);
    
    const result = await model.generateContent([prompt]);
    const response = result.response.text();
    
    return this.parseCodeGenerationResponse(response, context);
  }

  private buildGenerationPrompt(request: CodeGenerationRequest, context: ProjectContext): string {
    return `
You are a senior full-stack developer. Generate high-quality code based on the user's request.

User Request: "${request.query}"

Project Context:
- Technology Stack: ${context.techStack.join(', ')}
- Architecture Pattern: ${context.architecturePattern}
- Coding Standards: ${context.codingStandards}

Relevant Files and Dependencies:
${context.relevantFiles.map(f => `
File: ${f.fileName}
Type: ${f.type}
Exports: ${f.exports.join(', ')}
Summary: ${f.summary}
`).join('\n')}

Project Structure:
${context.projectStructure}

Generate code that:
1. Follows the existing project patterns and conventions
2. Uses the same technology stack and dependencies
3. Implements proper error handling and validation
4. Includes appropriate TypeScript types (if applicable)
5. Follows the established file/folder structure
6. Includes proper imports and exports

Respond with ONLY a JSON object in this format:
{
  "type": "new_file|file_modification|code_snippet|multiple_files",
  "files": [{
    "path": "relative/path/to/file.ts",
    "content": "complete file content here",
    "language": "typescript",
    "changeType": "create|modify|replace"
  }],
  "explanation": "Detailed explanation of the generated code",
  "warnings": ["Any potential issues or considerations"],
  "dependencies": ["new npm packages needed"]
}
`;
  }

  private buildRefactorPrompt(request: CodeGenerationRequest, context: ProjectContext): string {
    return `
You are an expert software architect. Refactor the code according to the user's request while preserving functionality.

User Request: "${request.query}"

Current Code Structure:
${JSON.stringify(context.relevantFiles, null, 2)}

Project Context:
${JSON.stringify(context, null, 2)}

Refactoring Guidelines:
1. Preserve all existing functionality and behavior
2. Improve code organization and maintainability
3. Follow SOLID principles and clean architecture
4. Update imports/exports as needed
5. Maintain backward compatibility where possible
6. Update tests if they exist

Respond with ONLY a JSON object showing the refactored code structure.
`;
  }

  private buildDebugPrompt(request: CodeGenerationRequest, context: ProjectContext): string {
    return `
You are an expert debugger. Analyze the code and provide solutions for the reported issue.

User Request: "${request.query}"

Code Context:
${JSON.stringify(context.relevantFiles, null, 2)}

Debugging Approach:
1. Identify the root cause of the issue
2. Provide step-by-step diagnosis
3. Suggest multiple solution approaches
4. Include logging/testing recommendations
5. Address potential edge cases

Respond with ONLY a JSON object with debugging solutions.
`;
  }

  private parseCodeGenerationResponse(response: string, context: ProjectContext): CodeGenerationResult {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.type || !parsed.files || !Array.isArray(parsed.files)) {
        throw new Error('Invalid response structure from AI');
      }

      // Process each file
      const processedFiles: GeneratedFile[] = parsed.files.map((file: any) => ({
        path: file.path,
        content: file.content,
        language: file.language || this.detectLanguage(file.path),
        changeType: file.changeType || 'create',
        diff: file.diff,
        insertionPoint: file.insertionPoint
      }));

      return {
        type: parsed.type,
        files: processedFiles,
        explanation: parsed.explanation || 'Code generated successfully',
        warnings: parsed.warnings || [],
        dependencies: parsed.dependencies || []
      };

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error(`Failed to parse code generation response: ${error.message}`);
    }
  }

  private async getProjectContext(projectId: string, contextLevel: string, targetFiles?: string[]): Promise<ProjectContext> {
    // Get relevant embeddings based on context level
    let relevantFiles: any[] = [];
    
    if (targetFiles && targetFiles.length > 0) {
      // Get specific files
      relevantFiles = await db.sourceCodeEmbedding.findMany({
        where: {
          projectId,
          fileName: { in: targetFiles }
        }
      });
    } else {
      // Get broader context based on level
      const limit = contextLevel === 'global' ? 50 : contextLevel === 'project' ? 20 : 10;
      relevantFiles = await db.sourceCodeEmbedding.findMany({
        where: { projectId },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Analyze project structure and patterns
    const techStack = this.inferTechStack(relevantFiles);
    const architecturePattern = this.inferArchitecturePattern(relevantFiles);
    const codingStandards = this.inferCodingStandards(relevantFiles);
    const projectStructure = this.buildProjectStructure(relevantFiles);

    return {
      relevantFiles: relevantFiles.map(f => ({
        fileName: f.fileName,
        summary: f.summary,
        sourceCode: f.sourceCode,
        type: this.inferFileType(f.fileName),
        exports: this.extractExports(f.sourceCode),
        imports: this.extractImports(f.sourceCode)
      })),
      techStack,
      architecturePattern,
      codingStandards,
      projectStructure
    };
  }

  private async getFileContent(fileName: string, projectId: string): Promise<string> {
    const file = await db.sourceCodeEmbedding.findFirst({
      where: {
        projectId,
        fileName
      }
    });

    if (!file) {
      throw new Error(`File not found: ${fileName}`);
    }

    try {
      const parsed = JSON.parse(file.sourceCode);
      return typeof parsed === 'string' ? parsed : parsed.content || '';
    } catch {
      return file.sourceCode;
    }
  }

  private inferTechStack(files: any[]): string[] {
    const stack = new Set<string>();
    
    files.forEach(file => {
      const fileName = file.fileName.toLowerCase();
      const content = file.sourceCode.toLowerCase();
      
      // Framework detection
      if (fileName.includes('next') || content.includes('next/')) stack.add('Next.js');
      if (content.includes('react')) stack.add('React');
      if (content.includes('vue')) stack.add('Vue.js');
      if (content.includes('angular')) stack.add('Angular');
      
      // Language detection
      if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) stack.add('TypeScript');
      if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) stack.add('JavaScript');
      if (fileName.endsWith('.py')) stack.add('Python');
      
      // Database
      if (content.includes('prisma')) stack.add('Prisma');
      if (content.includes('mongoose')) stack.add('MongoDB');
      if (content.includes('postgres')) stack.add('PostgreSQL');
      
      // Styling
      if (content.includes('tailwind')) stack.add('Tailwind CSS');
      if (content.includes('styled-components')) stack.add('Styled Components');
      
      // State Management
      if (content.includes('redux')) stack.add('Redux');
      if (content.includes('zustand')) stack.add('Zustand');
      if (content.includes('recoil')) stack.add('Recoil');
    });
    
    return Array.from(stack);
  }

  private inferArchitecturePattern(files: any[]): string {
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

  private inferCodingStandards(files: any[]): any {
    // Analyze common patterns in the codebase
    return {
      indentation: '2 spaces', // Could be inferred from actual code
      quotes: 'single', // Could be inferred
      semicolons: true,
      trailingCommas: true,
      maxLineLength: 100
    };
  }

  private buildProjectStructure(files: any[]): string {
    const structure: any = {};
    
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
    
    return this.formatStructure(structure);
  }

  private formatStructure(obj: any, indent = 0): string {
    let result = '';
    const spaces = '  '.repeat(indent);
    
    Object.keys(obj).forEach(key => {
      if (key === '_files') {
        obj[key].forEach((file: string) => {
          result += `${spaces}${file}\n`;
        });
      } else {
        result += `${spaces}${key}/\n`;
        result += this.formatStructure(obj[key], indent + 1);
      }
    });
    
    return result;
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
      'go': 'go'
    };
    return langMap[ext || ''] || 'text';
  }

  private inferFileType(fileName: string): string {
    const path = fileName.toLowerCase();
    if (path.includes('component')) return 'component';
    if (path.includes('hook')) return 'hook';
    if (path.includes('util')) return 'utility';
    if (path.includes('service')) return 'service';
    if (path.includes('api')) return 'api';
    if (path.includes('page')) return 'page';
    return 'module';
  }

  private extractExports(sourceCode: string): string[] {
    try {
      const parsed = JSON.parse(sourceCode);
      return parsed.exports || [];
    } catch {
      // Fallback regex parsing
      const exports: string[] = [];
      const exportMatches = sourceCode.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
      if (exportMatches) {
        exportMatches.forEach(match => {
          const name = match.match(/(\w+)$/)?.[1];
          if (name) exports.push(name);
        });
      }
      return exports;
    }
  }

  private extractImports(sourceCode: string): string[] {
    try {
      const parsed = JSON.parse(sourceCode);
      return parsed.imports || [];
    } catch {
      // Fallback regex parsing
      const imports: string[] = [];
      const importMatches = sourceCode.match(/import.*from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const module = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (module) imports.push(module);
        });
      }
      return imports;
    }
  }
}

interface ProjectContext {
  relevantFiles: Array<{
    fileName: string;
    summary: string;
    sourceCode: string;
    type: string;
    exports: string[];
    imports: string[];
  }>;
  techStack: string[];
  architecturePattern: string;
  codingStandards: any;
  projectStructure: string;
}