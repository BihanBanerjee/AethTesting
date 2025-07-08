// src/lib/code-generation-engine.ts - Complete Fixed Version
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/server/db";
import type { QueryIntent } from "./intent-classifier";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

IMPORTANT: Respond with ONLY a valid JSON object. Do not use backticks in the JSON values. Use \\n for line breaks in code.

\`\`\`json
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
\`\`\`
`;

    const result = await model.generateContent([prompt]);
    const response = result.response.text();
    
    return this.parseCodeGenerationResponse(response, context);
  }

  private async refactorCode(request: CodeGenerationRequest, context: ProjectContext): Promise<CodeGenerationResult> {
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

CRITICAL: Respond with a JSON object wrapped in \`\`\`json code block. Use \\n for line breaks in code content.

\`\`\`json
{
  "type": "new_file",
  "files": [{
    "path": "relative/path/to/file.ts",
    "content": "// Complete file content here\\nfunction example() {\\n  return 'hello';\\n}",
    "language": "typescript",
    "changeType": "create"
  }],
  "explanation": "Detailed explanation of the generated code",
  "warnings": ["Any potential issues or considerations"],
  "dependencies": ["new npm packages needed"]
}
\`\`\`
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

CRITICAL: Respond with a JSON object wrapped in \`\`\`json code block.

\`\`\`json
{
  "type": "file_modification",
  "files": [{"path": "...", "content": "...", "language": "...", "changeType": "modify"}],
  "explanation": "...",
  "warnings": [...],
  "dependencies": [...]
}
\`\`\`
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

CRITICAL: Respond with a JSON object wrapped in \`\`\`json code block.

\`\`\`json
{
  "type": "code_snippet",
  "files": [{"path": "debug-solution.ts", "content": "// Fixed code here", "language": "typescript", "changeType": "create"}],
  "explanation": "Debugging analysis and solution",
  "warnings": ["Potential issues to watch"],
  "dependencies": []
}
\`\`\`
`;
  }

  private parseCodeGenerationResponse(response: string, context: ProjectContext): CodeGenerationResult {
    try {
      console.log('🔍 Raw AI Response:', response.substring(0, 200) + '...');
      
      // SIMPLIFIED: Just extract JSON without aggressive cleaning
      let jsonStr = this.extractJSON(response);
      
      if (!jsonStr) {
        throw new Error('No valid JSON found in AI response');
      }

      console.log('📝 Extracted JSON:', jsonStr.substring(0, 200) + '...');
      
      // Try to parse directly first
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (firstError) {
        console.log('❌ First parse failed, trying light cleaning...');
        
        // Only do minimal, safe cleaning
        jsonStr = this.lightCleanJSON(jsonStr);
        console.log('🧹 Light cleaned JSON:', jsonStr.substring(0, 200) + '...');
        
        try {
          parsed = JSON.parse(jsonStr);
        } catch (secondError) {
          console.log('❌ Second parse failed, trying content extraction...');
          
          // Last resort: extract just the content if it's a code generation
          return this.extractCodeFromResponse(response);
        }
      }
      
      // Validate the response structure
      if (!parsed.type || !parsed.files || !Array.isArray(parsed.files)) {
        throw new Error('Invalid response structure from AI');
      }

      // Process each file and clean any remaining issues
      const processedFiles: GeneratedFile[] = parsed.files.map((file: any) => ({
        path: file.path,
        content: this.cleanCodeContent(file.content),
        language: file.language || this.detectLanguage(file.path),
        changeType: file.changeType || 'create',
        diff: file.diff,
        insertionPoint: file.insertionPoint
      }));

      console.log('✅ Successfully parsed AI response');
      return {
        type: parsed.type,
        files: processedFiles,
        explanation: parsed.explanation || 'Code generated successfully',
        warnings: parsed.warnings || [],
        dependencies: parsed.dependencies || []
      };

    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.error('Response was:', response.substring(0, 500) + '...');
      
      // Enhanced fallback: try to extract useful content
      return this.createSmartFallbackResponse(response, context);
    }
  }

  private extractJSON(response: string): string | null {
    // Strategy 1: Look for JSON between ```json and ```
    let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
    
    // Strategy 2: Look for any code block that starts with {
    jsonMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const content = jsonMatch?.[1]?.trim();
      if ( content !== undefined && content.startsWith('{')) {
        return content;
      }
    }
    
    // Strategy 3: Look for JSON object directly
    jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    return null;
  }

  private lightCleanJSON(jsonStr: string): string {
    // Only do minimal, safe cleaning that won't break valid JSON
    return jsonStr
      // Remove trailing commas before } or ]
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix obvious backtick issues (but be very careful)
      .replace(/:\s*`([^`]*)`/g, ': "$1"')
      // Remove any remaining markdown artifacts
      .replace(/^```json\s*/, '')
      .replace(/\s*```$/, '');
  }

  private extractCodeFromResponse(response: string): CodeGenerationResult {
    console.log('🔧 Extracting code from response as fallback');
    
    // Find all code blocks
    const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
    
    let extractedCode = '';
    let language = 'typescript';
    let explanation = 'Generated code (extracted from malformed response)';
    
    // Look for the largest code block that isn't JSON
    for (const block of codeBlocks) {
      const content = block.replace(/```\w*\n?/, '').replace(/\n?```$/, '').trim();
      
      // Skip if it looks like JSON
      if (content.startsWith('{') && content.includes('"type"')) {
        continue;
      }
      
      // Use the first non-JSON code block
      if (content.length > extractedCode.length) {
        extractedCode = content;
        
        // Try to detect language
        const langMatch = block.match(/```(\w+)/);
        if (langMatch && langMatch[1] !== 'json') {
          language = langMatch?.[1] ?? 'typescript';
        }
      }
    }
    
    // If no code blocks found, try to extract from the full response
    if (!extractedCode) {
      // Look for import statements or function definitions
      const importMatch = response.match(/import[\s\S]*?from[\s\S]*?;/);
      if (importMatch) {
        // Try to find a logical end point
        const lines = response.split('\n');
        let startIndex = -1;
        let endIndex = lines.length;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]?.includes('import') && startIndex === -1) {
            startIndex = i;
          }
          if (lines[i]?.includes('export') && startIndex !== -1) {
            endIndex = i + 10; // Include a few more lines after export
            break;
          }
        }
        
        if (startIndex !== -1) {
          extractedCode = lines.slice(startIndex, endIndex).join('\n');
        }
      }
    }
    
    // Final fallback
    if (!extractedCode) {
      extractedCode = '// Unable to extract code from AI response\n// Please try again or rephrase your request';
      explanation = 'Failed to parse AI response - please try again';
    }
    
    return {
      type: 'code_snippet',
      files: [{
        path: `generated-code.${language === 'typescript' ? 'ts' : language === 'jsx' ? 'jsx' : 'js'}`,
        content: extractedCode,
        language,
        changeType: 'create'
      }],
      explanation,
      warnings: ['Response parsing failed - extracted code may be incomplete'],
      dependencies: []
    };
  }

  private createSmartFallbackResponse(response: string, context: ProjectContext): CodeGenerationResult {
    console.log('🚨 Creating smart fallback response');
    
    // Try the code extraction first
    const extracted = this.extractCodeFromResponse(response);
    
    // If we got meaningful code, return it
    if ((extracted.files?.[0]?.content?.length ?? 0) > 50 && !(extracted.files?.[0]?.content?.includes('Unable to extract') ?? false)) {
      return extracted;
    }
    
    // Otherwise, create a helpful error response
    return {
      type: 'code_snippet',
      files: [{
        path: 'error-response.md',
        content: `# AI Response Processing Error

The AI generated a response, but it couldn't be parsed properly.

## What happened:
- The AI response contained malformed JSON
- Automatic extraction failed
- This is likely due to the AI including special characters in the response

## What you can do:
1. Try rephrasing your request more specifically
2. Ask for simpler code generation tasks
3. Specify the exact file type and structure you want

## Partial AI Response:
\`\`\`
${response.substring(0, 500)}${response.length > 500 ? '...' : ''}
\`\`\`

Please try again with a more specific request.`,
        language: 'markdown',
        changeType: 'create'
      }],
      explanation: 'AI response parsing failed - see the generated file for details and suggestions',
      warnings: [
        'Response parsing failed due to malformed JSON',
        'Try rephrasing your request more specifically',
        'Consider asking for simpler code generation tasks'
      ],
      dependencies: []
    };
  }

  private cleanCodeContent(content: string): string {
    if (!content) return '';
    
    // If content is wrapped in backticks, remove them
    if (content.startsWith('```') && content.endsWith('```')) {
      const lines = content.split('\n');
      lines.shift(); // Remove first ```
      lines.pop();   // Remove last ```
      content = lines.join('\n');
    }
    
    // Remove language specifier from first line if present
    content = content.replace(/^(typescript|javascript|tsx|jsx|ts|js)\n/, '');
    
    return content.trim();
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
    return {
      indentation: '2 spaces',
      quotes: 'single',
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
          if (!current._files) current._files = [];
          current._files.push(part);
        } else {
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
      const imports: string[] = [];
      const importMatches = sourceCode.match(/import.*from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const moduleName = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
          if (moduleName) imports.push(moduleName);
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