// src/app/(protected)/dashboard/actions/prompts/code-generation-prompts.ts
import type { ProjectContext, CodeGenerationRequirements } from '../types/action-types';

export function buildCodeGenerationPrompt(
  prompt: string, 
  projectContext: ProjectContext, 
  requirements?: CodeGenerationRequirements
): string {
  return `
You are a senior full-stack developer generating high-quality code.

USER REQUEST: "${prompt}"

PROJECT CONTEXT:
- Technology Stack: ${projectContext.techStack.join(', ')}
- Architecture Pattern: ${projectContext.architecture}
- Recent Files: ${projectContext.recentFiles.map(f => f.fileName).join(', ')}

REQUIREMENTS:
- Framework: ${requirements?.framework || 'React'}
- Language: ${requirements?.language || 'TypeScript'}
- Features: ${requirements?.features?.join(', ') || 'Standard features'}
- Constraints: ${requirements?.constraints?.join(', ') || 'None specified'}

PROJECT FILE STRUCTURE:
${projectContext.structure}

RECENT CODE PATTERNS:
${projectContext.recentFiles.map(f => `
File: ${f.fileName}
Pattern: ${f.summary}
`).join('\n')}

Generate production-ready code that:
1. Follows the project's existing patterns and conventions
2. Uses the same technology stack and architecture
3. Implements proper error handling and validation
4. Includes appropriate TypeScript types
5. Follows the established file/folder structure
6. Includes proper imports and exports
7. Has comprehensive comments
8. Includes usage examples

Provide the complete, working implementation in markdown with code blocks.
`;
}