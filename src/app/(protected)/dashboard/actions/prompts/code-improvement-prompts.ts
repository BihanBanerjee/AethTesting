// src/app/(protected)/dashboard/actions/prompts/code-improvement-prompts.ts
import type { ProjectContext, ImprovementType } from '../types/action-types';
import { IMPROVEMENT_FOCUS_TEMPLATES } from '../config/prompts-config';

export function buildCodeImprovementPrompt(
  code: string,
  goals: string,
  projectContext: ProjectContext,
  improvementType: ImprovementType
): string {
  const focusArea = IMPROVEMENT_FOCUS_TEMPLATES[improvementType];
  
  return `
You are an expert code reviewer focused on ${improvementType} improvements.

IMPROVEMENT GOALS: "${goals}"
IMPROVEMENT TYPE: ${improvementType}

CURRENT CODE:
\`\`\`
${code}
\`\`\`

PROJECT CONTEXT:
- Tech Stack: ${projectContext.techStack.join(', ')}
- Architecture: ${projectContext.architecture}
- Coding Standards: ${JSON.stringify(projectContext.standards)}

Provide improvements focusing on:
${focusArea}

Provide:
1. Detailed analysis of current issues
2. Improved code with explanations
3. Performance/quality metrics comparison
4. Additional recommendations

Use markdown with before/after code examples.
`;
}