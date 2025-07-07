// src/app/(protected)/dashboard/actions.ts - Enhanced Version
'use server'
import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from '@/lib/gemini'
import { db } from '@/server/db'

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
})

// Enhanced askQuestion function with intent awareness
export async function askQuestion(question: string, projectId: string, intent?: string) {
    const stream = createStreamableValue()

    const queryVector = await generateEmbedding(question)
    const vectorQuery = `[${queryVector.join(',')}]`

    // Adjust similarity threshold and limit based on intent
    const similarityThreshold = intent === 'explain' ? 0.3 : 0.5;
    const resultLimit = intent === 'code_review' ? 15 : 10;

    const result = await db.$queryRaw`
    SELECT "fileName","sourceCode", "summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > ${similarityThreshold}
    AND "projectId" = ${projectId}
    ORDER BY similarity DESC
    LIMIT ${resultLimit}
    ` as {
        fileName: string,
        sourceCode: string,
        summary: string
    }[]

    let context = ''

    for(const doc of result) {
        context += `source: ${doc.fileName}\ncode content:${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`
    }

    // Build intent-aware prompt
    const systemPrompt = buildIntentAwarePrompt(intent, question, context);

    (async() => {
        const { textStream } = await streamText({
            model: google('gemini-1.5-flash'),
            prompt: systemPrompt
        });

        for await (const delta of textStream) {
            stream.update(delta)
        }
        stream.done()
    })()

    return {
        output: stream.value,
        filesReferences: result
    }
}

// New function for code generation
export async function generateCode(
    prompt: string, 
    projectId: string, 
    requirements?: {
        framework?: string;
        language?: string;
        features?: string[];
        constraints?: string[];
    }
) {
    const stream = createStreamableValue()

    // Get project context for better code generation
    const projectContext = await getProjectContext(projectId);
    
    const generationPrompt = buildCodeGenerationPrompt(prompt, projectContext, requirements);

    (async() => {
        const { textStream } = await streamText({
            model: google('gemini-1.5-pro'), // Use Pro for code generation
            prompt: generationPrompt
        });

        for await (const delta of textStream) {
            stream.update(delta)
        }
        stream.done()
    })()

    return {
        output: stream.value,
        context: projectContext
    }
}

// New function for code improvement
export async function improveCode(
    code: string,
    improvementGoals: string,
    projectId: string,
    improvementType: 'performance' | 'readability' | 'security' | 'optimization' = 'optimization'
) {
    const stream = createStreamableValue()

    const projectContext = await getProjectContext(projectId);
    const improvementPrompt = buildCodeImprovementPrompt(code, improvementGoals, projectContext, improvementType);

    (async() => {
        const { textStream } = await streamText({
            model: google('gemini-1.5-pro'),
            prompt: improvementPrompt
        });

        for await (const delta of textStream) {
            stream.update(delta)
        }
        stream.done()
    })()

    return {
        output: stream.value,
        originalCode: code
    }
}

// New function for debugging assistance
export async function debugCode(
    errorDescription: string,
    projectId: string,
    suspectedFiles?: string[]
) {
    const stream = createStreamableValue()

    // Get relevant context for debugging
    let context = '';
    
    if (suspectedFiles && suspectedFiles.length > 0) {
        const fileContents = await db.sourceCodeEmbedding.findMany({
            where: {
                projectId,
                fileName: { in: suspectedFiles }
            }
        });
        
        context = fileContents.map(f => `
File: ${f.fileName}
Code: ${f.sourceCode}
Summary: ${f.summary}
`).join('\n\n');
    } else {
        // Use vector search to find relevant files
        const errorVector = await generateEmbedding(errorDescription);
        const vectorQuery = `[${errorVector.join(',')}]`;

        const relevantFiles = await db.$queryRaw`
            SELECT "fileName", "sourceCode", "summary",
            1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
            FROM "SourceCodeEmbedding"
            WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
            AND "projectId" = ${projectId}
            ORDER BY similarity DESC
            LIMIT 5
        ` as any[];

        context = relevantFiles.map(f => `
File: ${f.fileName}
Code: ${f.sourceCode}
Summary: ${f.summary}
Relevance: ${Math.round(f.similarity * 100)}%
`).join('\n\n');
    }

    const debugPrompt = buildDebugPrompt(errorDescription, context);

    (async() => {
        const { textStream } = await streamText({
            model: google('gemini-1.5-pro'),
            prompt: debugPrompt
        });

        for await (const delta of textStream) {
            stream.update(delta)
        }
        stream.done()
    })()

    return {
        output: stream.value,
        relevantFiles: suspectedFiles || []
    }
}

// Helper function to build intent-aware prompts
function buildIntentAwarePrompt(intent: string | undefined, question: string, context: string): string {
    const basePrompt = `
You are an ai code assistant who answers questions about codebase. Your target audience is technical developers trying to understand and work with projects or repositories.
AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of AI include expert knowledge, helpfulness, cleverness and articulateness.
AI is a well-behaved and well-mannered individual.
AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.

START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK

START QUESTION
${question}
END OF QUESTION
`;

    // Add intent-specific instructions
    switch (intent) {
        case 'code_generation':
            return basePrompt + `
INTENT: CODE GENERATION
Please provide complete, working code examples with:
1. Full implementation details
2. Proper error handling
3. Type definitions (if TypeScript)
4. Comments explaining key parts
5. Usage examples
Answer in markdown syntax with code blocks. Be as detailed as possible.`;

        case 'code_improvement':
            return basePrompt + `
INTENT: CODE IMPROVEMENT
Please analyze the code and provide:
1. Specific improvement suggestions
2. Performance optimizations
3. Code quality enhancements
4. Best practices recommendations
5. Before/after code examples
Focus on actionable improvements with clear explanations.`;

        case 'code_review':
            return basePrompt + `
INTENT: CODE REVIEW
Please conduct a thorough code review covering:
1. Code quality and style
2. Potential bugs or issues
3. Performance considerations
4. Security vulnerabilities
5. Maintainability and readability
6. Best practices adherence
Provide specific line-by-line feedback where applicable.`;

        case 'debug':
            return basePrompt + `
INTENT: DEBUGGING
Please provide debugging assistance including:
1. Root cause analysis
2. Step-by-step debugging approach
3. Common causes of similar issues
4. Testing strategies to verify fixes
5. Prevention measures
Be systematic and provide actionable debugging steps.`;

        case 'refactor':
            return basePrompt + `
INTENT: REFACTORING
Please suggest refactoring improvements:
1. Code structure improvements
2. Design pattern applications
3. Separation of concerns
4. Code reusability enhancements
5. Maintainability improvements
Provide before/after examples and explain the benefits.`;

        case 'explain':
            return basePrompt + `
INTENT: CODE EXPLANATION
Please provide a clear, educational explanation covering:
1. What the code does (high-level overview)
2. How it works (step-by-step breakdown)
3. Key concepts and patterns used
4. Dependencies and relationships
5. Potential use cases
Make it accessible while being technically accurate.`;

        default:
            return basePrompt + `
AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
If the context does not provide the answer to the question, AI will say, "I'm sorry, but I don't know the answer to that based on the available context."
AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
AI assistant will not invent anything that is not drawn directly from the context.
Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering.`;
    }
}

function buildCodeGenerationPrompt(
    prompt: string, 
    projectContext: any, 
    requirements?: any
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

function buildCodeImprovementPrompt(
    code: string,
    goals: string,
    projectContext: any,
    improvementType: string
): string {
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
${improvementType === 'performance' ? 
  '- Algorithm optimization\n- Memory usage reduction\n- Rendering performance\n- Bundle size optimization' :
  improvementType === 'security' ?
  '- Input validation\n- XSS prevention\n- Authentication checks\n- Data sanitization' :
  improvementType === 'readability' ?
  '- Code clarity\n- Naming conventions\n- Code organization\n- Documentation' :
  '- General code quality\n- Best practices\n- Maintainability\n- Reusability'
}

Provide:
1. Detailed analysis of current issues
2. Improved code with explanations
3. Performance/quality metrics comparison
4. Additional recommendations

Use markdown with before/after code examples.
`;
}

function buildDebugPrompt(errorDescription: string, context: string): string {
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

// Helper function to get project context
async function getProjectContext(projectId: string) {
    // Get recent files and project structure
    const recentFiles = await db.sourceCodeEmbedding.findMany({
        where: { projectId },
        orderBy: { id: 'desc' },
        take: 10,
        select: { fileName: true, summary: true }
    });

    // Analyze tech stack from file extensions and content
    const allFiles = await db.sourceCodeEmbedding.findMany({
        where: { projectId },
        select: { fileName: true, sourceCode: true }
    });

    const techStack = analyzeTechStack(allFiles);
    const architecture = analyzeArchitecture(allFiles);
    const structure = buildProjectStructure(allFiles);
    const standards = analyzeCodingStandards(allFiles);

    return {
        recentFiles,
        techStack,
        architecture,
        structure,
        standards
    };
}

function analyzeTechStack(files: any[]): string[] {
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
        
        // Testing
        if (content.includes('jest')) stack.add('Jest');
        if (content.includes('vitest')) stack.add('Vitest');
        if (content.includes('cypress')) stack.add('Cypress');
        if (content.includes('playwright')) stack.add('Playwright');
        
        // Build Tools
        if (content.includes('webpack')) stack.add('Webpack');
        if (content.includes('vite')) stack.add('Vite');
        if (content.includes('rollup')) stack.add('Rollup');
        
        // Authentication
        if (content.includes('clerk')) stack.add('Clerk');
        if (content.includes('auth0')) stack.add('Auth0');
        if (content.includes('supabase')) stack.add('Supabase');
        
        // API
        if (content.includes('trpc')) stack.add('tRPC');
        if (content.includes('graphql')) stack.add('GraphQL');
        if (content.includes('apollo')) stack.add('Apollo');
    });
    
    return Array.from(stack);
}

function analyzeArchitecture(files: any[]): string {
    const patterns = {
        'clean-architecture': 0,
        'mvc': 0,
        'layered': 0,
        'microservices': 0,
        'component-based': 0,
        'jamstack': 0
    };

    files.forEach(file => {
        const path = file.fileName.toLowerCase();
        
        // Clean Architecture
        if (path.includes('usecase') || path.includes('entity') || path.includes('adapter')) {
            patterns['clean-architecture']++;
        }
        
        // MVC
        if (path.includes('controller') || path.includes('model') || path.includes('view')) {
            patterns.mvc++;
        }
        
        // Layered
        if (path.includes('service') || path.includes('repository') || path.includes('domain')) {
            patterns.layered++;
        }
        
        // Microservices
        if (path.includes('api/') && (path.includes('route') || path.includes('handler'))) {
            patterns.microservices++;
        }
        
        // Component-based
        if (path.includes('component') || path.includes('hook') || path.includes('provider')) {
            patterns['component-based']++;
        }
        
        // JAMstack
        if (path.includes('static') || path.includes('public') || path.includes('_app') || path.includes('pages/')) {
            patterns.jamstack++;
        }
    });

    const dominantPattern = Object.entries(patterns).reduce((a, b) => 
        patterns[a[0] as keyof typeof patterns] > patterns[b[0] as keyof typeof patterns] ? a : b
    );

    return dominantPattern[0];
}

function buildProjectStructure(files: any[]): string {
    const structure: Record<string, any> = {};
    
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
    
    return formatStructure(structure);
}

function formatStructure(obj: any, indent = 0): string {
    let result = '';
    const spaces = '  '.repeat(indent);
    
    Object.keys(obj).forEach(key => {
        if (key === '_files') {
            obj[key].slice(0, 5).forEach((file: string) => {
                result += `${spaces}${file}\n`;
            });
            if (obj[key].length > 5) {
                result += `${spaces}... and ${obj[key].length - 5} more files\n`;
            }
        } else {
            result += `${spaces}${key}/\n`;
            result += formatStructure(obj[key], indent + 1);
        }
    });
    
    return result;
}

function analyzeCodingStandards(files: any[]): any {
    // Analyze common patterns in the codebase
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
            if (match) {
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