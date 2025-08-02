// src/app/(protected)/dashboard/actions/prompts/intent-prompts.ts
import { BASE_PROMPT_TEMPLATE, DEFAULT_PROMPT_SUFFIX } from '../config/prompts-config';

export const INTENT_PROMPTS = {
  question: `
INTENT: QUESTION ANSWERING
Please provide a comprehensive answer based on the context:
1. Direct answer to the question with relevant code examples
2. Step-by-step explanations when applicable
3. Related concepts, files, or patterns that might be helpful
4. Practical usage examples from the codebase
5. Educational context to aid understanding

Take into account any CONTEXT BLOCK provided. If the context does not provide the answer to the question, say "I'm sorry, but I don't know the answer to that based on the available context." Do not invent anything not drawn directly from the context. Answer in markdown syntax with code snippets. Be as detailed as possible when answering.`,

  code_generation: `
INTENT: CODE GENERATION
Please provide complete, working code examples with:
1. Full implementation details
2. Proper error handling
3. Type definitions (if TypeScript)
4. Comments explaining key parts
5. Usage examples
Answer in markdown syntax with code blocks. Be as detailed as possible.`,

  code_improvement: `
INTENT: CODE IMPROVEMENT
Please analyze the code and provide:
1. Specific improvement suggestions
2. Performance optimizations
3. Code quality enhancements
4. Best practices recommendations
5. Before/after code examples
Focus on actionable improvements with clear explanations.`,

  code_review: `
INTENT: CODE REVIEW
Please conduct a thorough code review covering:
1. Code quality and style
2. Potential bugs or issues
3. Performance considerations
4. Security vulnerabilities
5. Maintainability and readability
6. Best practices adherence
Provide specific line-by-line feedback where applicable.`,

  debug: `
INTENT: DEBUGGING
Please provide debugging assistance including:
1. Root cause analysis
2. Step-by-step debugging approach
3. Common causes of similar issues
4. Testing strategies to verify fixes
5. Prevention measures
Be systematic and provide actionable debugging steps.`,

  refactor: `
INTENT: REFACTORING
Please suggest refactoring improvements:
1. Code structure improvements
2. Design pattern applications
3. Separation of concerns
4. Code reusability enhancements
5. Maintainability improvements
Provide before/after examples and explain the benefits.`,

  explain: `
INTENT: CODE EXPLANATION
Please provide a clear, educational explanation covering:
1. What the code does (high-level overview)
2. How it works (step-by-step breakdown)
3. Key concepts and patterns used
4. Dependencies and relationships
5. Potential use cases
Make it accessible while being technically accurate.`,
} as const;

export function buildIntentAwarePrompt(intent: string | undefined, question: string, context: string): string {
  const basePrompt = BASE_PROMPT_TEMPLATE
    .replace('{context}', context)
    .replace('{question}', question);

  const intentSuffix = intent && intent in INTENT_PROMPTS 
    ? INTENT_PROMPTS[intent as keyof typeof INTENT_PROMPTS]
    : DEFAULT_PROMPT_SUFFIX;

  return basePrompt + intentSuffix;
}