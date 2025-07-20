import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type PrismaClient } from "@prisma/client";

type ServiceContext = {
  db: PrismaClient;
  user: { userId: string | null; };
  headers: Headers;
};

export const aiCodeService = {
  async generateCode(
    ctx: ServiceContext,
    input: {
      projectId: string;
      prompt: string;
      context?: string[];
      requirements?: {
        framework?: string;
        language?: string;
        features?: string[];
        constraints?: string[];
      };
    }
  ) {
    const { CodeGenerationEngine } = await import('@/lib/code-generation');
    const { IntentClassifier } = await import('@/lib/intent-classifier');
    
    const classifier = new IntentClassifier();
    const engine = new CodeGenerationEngine();
    
    // Classify the intent with code generation focus
    const intent = await classifier.classifyQuery(input.prompt);
    intent.type = 'code_generation'; // Override to ensure code generation
    intent.requiresCodeGen = true;
    
    // Generate code
    const result = await engine.generateCode({
      intent,
      query: input.prompt,
      projectId: input.projectId,
      contextFiles: input.context
    });
    
    return {
      generatedCode: result.files[0]?.content,
      explanation: result.explanation,
      language: result.files[0]?.language || 'typescript',
      warnings: result.warnings,
      dependencies: result.dependencies,
      files: result.files
    };
  },

  async improveCode(
    ctx: ServiceContext,
    input: {
      projectId: string;
      suggestions: string;
      targetFiles?: string[];
      improvementType?: 'performance' | 'readability' | 'security' | 'optimization';
    }
  ) {
    const { CodeGenerationEngine } = await import('@/lib/code-generation');
    const { IntentClassifier } = await import('@/lib/intent-classifier');
    
    const classifier = new IntentClassifier();
    const engine = new CodeGenerationEngine();
    
    const intent = await classifier.classifyQuery(input.suggestions);
    intent.type = 'code_improvement';
    intent.requiresFileModification = true;
    
    const result = await engine.generateCode({
      intent,
      query: input.suggestions,
      projectId: input.projectId,
      contextFiles: input.targetFiles,
      targetFile: input.targetFiles?.[0]
    });
    
    return {
      improvedCode: result.files[0]?.content,
      explanation: result.explanation,
      diff: result.files[0]?.diff,
      suggestions: result.warnings?.map(w => ({ 
        type: 'improvement' as const, 
        description: w 
      })) || [],
      language: result.files[0]?.language
    };
  },

  async reviewCode(
    ctx: ServiceContext,
    input: {
      projectId: string;
      files: string[];
      reviewType: 'security' | 'performance' | 'comprehensive';
      focusAreas?: string;
    }
  ) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Get file contents for review
    const fileContents = await ctx.db.sourceCodeEmbedding.findMany({
      where: {
        projectId: input.projectId,
        fileName: { in: input.files }
      }
    });

    if (fileContents.length === 0) {
      throw new Error('No files found for review');
    }

    // Prepare review context
    const codeForReview = fileContents.map(f => `
      File: ${f.fileName}
      Content:
      ${typeof f.sourceCode === 'string' ? f.sourceCode : JSON.stringify(f.sourceCode)}
      `).join('\n\n');

    const reviewPrompt = `
      You are a senior code reviewer conducting a ${input.reviewType} review. 

      ${input.focusAreas ? `Focus Areas: ${input.focusAreas}` : ''}

      Code to Review:
      ${codeForReview}

      Provide a comprehensive review focusing on:
      ${input.reviewType === 'security' ? 
      '- Security vulnerabilities\n- Input validation\n- Authentication/Authorization\n- Data sanitization' :
      input.reviewType === 'performance' ?
      '- Performance bottlenecks\n- Memory usage\n- Algorithm efficiency\n- Resource optimization' :
      '- Code quality\n- Best practices\n- Maintainability\n- Testing\n- Documentation'
      }

      Respond with ONLY a JSON object:
      {
        "issues": [
          {
            "type": "security|performance|style|logic",
            "severity": "high|medium|low",
            "file": "filename",
            "line": number,
            "description": "Issue description",
            "suggestion": "How to fix"
          }
        ],
        "suggestions": [
          {
            "type": "improvement|optimization|refactor",
            "description": "Suggestion description",
            "impact": "Expected impact"
          }
        ],
        "summary": "Overall review summary",
        "score": number // 1-10 quality score
      }
    `;

    try {
      const result = await model.generateContent([reviewPrompt]);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in review response');
      }
      
      const reviewResult = JSON.parse(jsonMatch[0]);
      
      return {
        issues: reviewResult.issues || [],
        suggestions: reviewResult.suggestions || [],
        summary: reviewResult.summary || 'Review completed',
        score: reviewResult.score || 7,
        filesReviewed: input.files
      };
      
    } catch (error) {
      console.error('Code review failed:', error);
      return {
        issues: [],
        suggestions: [],
        summary: 'Review failed due to processing error',
        score: 0,
        filesReviewed: input.files
      };
    }
  },

  async debugCode(
    ctx: ServiceContext,
    input: {
      projectId: string;
      errorDescription: string;
      suspectedFiles?: string[];
      contextLevel: 'file' | 'function' | 'project' | 'global';
    }
  ) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Get relevant code context based on suspected files or broader search
    let codeContext = '';
    
    if (input.suspectedFiles && input.suspectedFiles.length > 0) {
      const fileContents = await ctx.db.sourceCodeEmbedding.findMany({
        where: {
          projectId: input.projectId,
          fileName: { in: input.suspectedFiles }
        }
      });
      
      codeContext = fileContents.map(f => `
        File: ${f.fileName}
        Code: ${typeof f.sourceCode === 'string' ? f.sourceCode : JSON.stringify(f.sourceCode)}
        Summary: ${f.summary}
        `).join('\n\n');
    } else {
      // Use vector search to find relevant files based on error description
      const { generateEmbedding } = await import('@/lib/gemini');
      const errorEmbedding = await generateEmbedding(input.errorDescription);
      const vectorQuery = `[${errorEmbedding.join(',')}]`;

      const relevantFiles = await ctx.db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
        AND "projectId" = ${input.projectId}
        ORDER BY similarity DESC
        LIMIT 5
      ` as any[];

      codeContext = relevantFiles.map(f => `
        File: ${f.fileName}
        Code: ${f.sourceCode}
        Summary: ${f.summary}
        Relevance: ${Math.round(f.similarity * 100)}%
        `).join('\n\n');
    }

    const debugPrompt = `
      You are an expert debugger. Analyze this error and provide debugging assistance.

      Error Description: "${input.errorDescription}"

      Relevant Code Context:
      ${codeContext}

      Provide debugging analysis with ONLY a JSON response:
      {
        "diagnosis": "Root cause analysis",
        "solutions": [
          {
            "type": "fix|workaround|investigation",
            "description": "Solution description",
            "code": "Code fix if applicable",
            "priority": "high|medium|low"
          }
        ],
        "recommendations": [
          {
            "type": "prevention|testing|monitoring",
            "description": "Recommendation description"
          }
        ],
        "investigationSteps": [
          "Step 1: Check...",
          "Step 2: Verify..."
        ]
      }
    `;

    try {
      const result = await model.generateContent([debugPrompt]);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in debug response');
      }
      
      const debugResult = JSON.parse(jsonMatch[0]);
      
      return {
        diagnosis: debugResult.diagnosis || 'Unable to determine root cause',
        solutions: debugResult.solutions || [],
        recommendations: debugResult.recommendations || [],
        investigationSteps: debugResult.investigationSteps || [],
        contextFiles: input.suspectedFiles || []
      };
      
    } catch (error) {
      console.error('Debug analysis failed:', error);
      return {
        diagnosis: 'Debug analysis failed due to processing error',
        solutions: [],
        recommendations: [],
        investigationSteps: [],
        contextFiles: []
      };
    }
  },

  async refactorCode(
    ctx: ServiceContext,
    input: {
      projectId: string;
      refactoringGoals: string;
      targetFiles?: string[];
      preserveAPI?: boolean;
    }
  ) {
    const { CodeGenerationEngine } = await import('@/lib/code-generation');
    const { IntentClassifier } = await import('@/lib/intent-classifier');
    
    const classifier = new IntentClassifier();
    const engine = new CodeGenerationEngine();
    
    const intent = await classifier.classifyQuery(input.refactoringGoals);
    intent.type = 'refactor';
    intent.requiresFileModification = true;
    
    const result = await engine.generateCode({
      intent,
      query: `Refactor code with these goals: ${input.refactoringGoals}${input.preserveAPI ? ' (preserve existing API)' : ''}`,
      projectId: input.projectId,
      contextFiles: input.targetFiles
    });
    
    return {
      refactoredCode: result.files[0]?.content,
      explanation: result.explanation,
      changes: result.files,
      warnings: result.warnings,
      apiChanges: input.preserveAPI ? [] : result.warnings?.filter(w => w.includes('API')) || []
    };
  },

  async explainCode(
    ctx: ServiceContext,
    input: {
      projectId: string;
      query: string;
      targetFiles?: string[];
      detailLevel?: 'brief' | 'detailed' | 'comprehensive';
    }
  ) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Get code to explain
    let codeToExplain = '';
    
    if (input.targetFiles && input.targetFiles.length > 0) {
      const fileContents = await ctx.db.sourceCodeEmbedding.findMany({
        where: {
          projectId: input.projectId,
          fileName: { in: input.targetFiles }
        }
      });
      
      codeToExplain = fileContents.map(f => `
        File: ${f.fileName}
        Code: ${typeof f.sourceCode === 'string' ? f.sourceCode : JSON.stringify(f.sourceCode)}
        `).join('\n\n');
    } else {
      // Use vector search to find relevant code
      const { generateEmbedding } = await import('@/lib/gemini');
      const queryEmbedding = await generateEmbedding(input.query);
      const vectorQuery = `[${queryEmbedding.join(',')}]`;

      const relevantFiles = await ctx.db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.4
        AND "projectId" = ${input.projectId}
        ORDER BY similarity DESC
        LIMIT 3
      ` as any[];

      codeToExplain = relevantFiles.map(f => `
        File: ${f.fileName}
        Code: ${f.sourceCode}
        `).join('\n\n');
    }

    const detailLevel = input.detailLevel || 'detailed';
    const detailLevelInstructions = {
      brief: 'Provide a concise, high-level explanation (2-3 sentences).',
      detailed: 'Provide a thorough explanation with key concepts and flow.',
      comprehensive: 'Provide an in-depth explanation covering all aspects, patterns, and nuances.'
    };

    const explainPrompt = `
      You are a senior software engineer explaining code to a colleague.

      Query: "${input.query}"
      Detail Level: ${detailLevel}

      Code to Explain:
      ${codeToExplain}

      ${detailLevelInstructions[detailLevel]}

      Respond with ONLY a JSON object:
      {
        "explanation": "Main explanation of the code",
        "keyPoints": [
          "Important point 1",
          "Important point 2"
        ],
        "codeFlow": [
          "Step 1: ...",
          "Step 2: ..."
        ],
        "patterns": [
          "Design pattern or technique used"
        ],
        "dependencies": [
          "External dependencies or libraries"
        ],
        "recommendations": [
          "Suggested improvements or considerations"
        ]
      }
    `;

    try {
      const result = await model.generateContent([explainPrompt]);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in explanation response');
      }
      
      const explanationResult = JSON.parse(jsonMatch[0]);
      
      return {
        explanation: explanationResult.explanation || 'Unable to provide explanation',
        keyPoints: explanationResult.keyPoints || [],
        codeFlow: explanationResult.codeFlow || [],
        patterns: explanationResult.patterns || [],
        dependencies: explanationResult.dependencies || [],
        recommendations: explanationResult.recommendations || [],
        filesAnalyzed: input.targetFiles || []
      };
      
    } catch (error) {
      console.error('Code explanation failed:', error);
      return {
        explanation: 'Code explanation failed due to processing error',
        keyPoints: [],
        codeFlow: [],
        patterns: [],
        dependencies: [],
        recommendations: [],
        filesAnalyzed: []
      };
    }
  }
};