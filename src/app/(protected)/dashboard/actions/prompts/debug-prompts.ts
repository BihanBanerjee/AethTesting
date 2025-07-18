// src/app/(protected)/dashboard/actions/prompts/debug-prompts.ts
export function buildDebugPrompt(errorDescription: string, context: string): string {
  return `
You are an expert debugger helping to solve a coding issue.

ERROR DESCRIPTION: "${errorDescription}"

RELEVANT CODE CONTEXT:
${context}

Provide comprehensive debugging assistance:

1. ROOT CAUSE ANALYSIS:
   - Analyze the error description
   - Identify likely causes based on the code context
   - Explain why this error occurs

2. DEBUGGING STEPS:
   - Provide step-by-step debugging approach
   - Suggest debugging tools and techniques
   - Recommend logging/console strategies

3. SOLUTION OPTIONS:
   - Provide specific code fixes
   - Explain multiple solution approaches
   - Highlight trade-offs of each solution

4. PREVENTION MEASURES:
   - Suggest testing strategies
   - Recommend error handling improvements
   - Provide monitoring/logging recommendations

5. RELATED ISSUES:
   - Identify similar problems that might occur
   - Suggest code patterns to avoid
   - Recommend best practices

Use markdown formatting with clear sections and code examples.
Be systematic and provide actionable solutions.
`;
}