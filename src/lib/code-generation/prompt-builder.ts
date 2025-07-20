// src/lib/code-generation/prompt-builder.ts
import type { CodeGenerationRequest, ProjectContext } from "./types";

export class PromptBuilder {
  buildGenerationPrompt(request: CodeGenerationRequest, context: ProjectContext): string {
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

  buildImprovementPrompt(request: CodeGenerationRequest, context: ProjectContext, fileContent: string): string {
    const targetFile = request.targetFile || request.contextFiles?.[0];
    
    return `
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
  }

  buildRefactorPrompt(request: CodeGenerationRequest, context: ProjectContext): string {
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

  buildDebugPrompt(request: CodeGenerationRequest, context: ProjectContext): string {
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
}