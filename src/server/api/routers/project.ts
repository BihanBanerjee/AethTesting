import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "../trpc";
import { pollCommits } from "@/lib/github";
import { checkCredits } from "@/lib/github";
import { inngest } from "@/lib/inngest/client";
import { calculateQuestionImpact, formatProcessingTime, getConfidenceLevel, getIntentColor, getIntentIcon, getQuestionStatistics, getSatisfactionLevel } from "@/lib/intent";

export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
        })
    ).mutation(async ({ctx, input}) => {
        const user = await ctx.db.user.findUnique({
            where: {
                id: ctx.user.userId!
            },
            select: {
                credits: true
            }
        });

        if(!user) {
            throw new Error('User not found');
        }

        const currentCredits = user.credits || 0;
        const fileCount = await checkCredits(input.githubUrl, input.githubToken ?? '');
        
        if(currentCredits < fileCount) {
            throw new Error('Insufficient credits');
        }

        // Create project with initial status
        const project = await ctx.db.project.create({
            data: {
                githubUrl: input.githubUrl,
                name: input.name,
                status: 'INITIALIZING',
                totalFiles: fileCount,
                processedFiles: 0,
                processingLogs: {
                    logs: [],
                    startedAt: new Date().toISOString()
                },
                userToProjects: {
                    create: {
                        userId: ctx.user.userId!,
                    }
                }
            }
        });

        // Trigger the background processing with Inngest
        await inngest.send({
            name: "project.creation.requested",
            data: {
                projectId: project.id,
                githubUrl: input.githubUrl,
                githubToken: input.githubToken,
                userId: ctx.user.userId!,
                fileCount
            }
        });

        return project;
    }),


    getProjectFiles: protectedProcedure.input(
        z.object({
            projectId: z.string(),
        })
    ).query(async ({ctx, input}) => {
        return await ctx.db.sourceCodeEmbedding.findMany({
            where: {
                projectId: input.projectId
            },
            select: {
                fileName: true,
                summary: true
            },
            orderBy: {
                fileName: 'asc'
            }
        });
    }),


    askQuestionWithIntent: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            query: z.string(),
            contextFiles: z.array(z.string()).optional(),
            intent: z.string().optional(),
            classifyOnly: z.boolean().optional()
        })
    ).mutation(async ({ ctx, input }) => {
        const { IntentClassifier } = await import('@/lib/intent-classifier');
        const classifier = new IntentClassifier();

        // Get project context for better classification
        const projectContext = await ctx.db.sourceCodeEmbedding.findMany({
            where: { projectId: input.projectId },
            select: { fileName: true },
            take: 100
        });

        const availableFiles = projectContext.map(f => f.fileName);

        // Classify the intent
        const intent = await classifier.classifyQuery(input.query, {
            availableFiles,
            targetFiles: input.contextFiles || []
        });

        // If only classification is requested, return early
        if (input.classifyOnly) {
            return { intent };
        }

        // For regular questions, use existing askQuestion logic
        const { askQuestion } = await import('@/app/(protected)/dashboard/actions');
        const result = await askQuestion(input.query, input.projectId);

        return {
            intent,
            answer: result.output,
            filesReferences: result.filesReferences
        };
    }),

    // Code Generation with Intent
    generateCode: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            prompt: z.string(),
            context: z.array(z.string()).optional(),
            requirements: z.object({
                framework: z.string().optional(),
                language: z.string().optional(),
                features: z.array(z.string()).optional(),
                constraints: z.array(z.string()).optional()
            }).optional(),
        })
    ).mutation(async ({ ctx, input }) => {
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
    }),

    // Code Improvement with Intent
    improveCode: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            suggestions: z.string(),
            targetFiles: z.array(z.string()).optional(),
            improvementType: z.enum(['performance', 'readability', 'security', 'optimization']).optional(),
        })
    ).mutation(async ({ ctx, input }) => {
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
    }),

    // Code Review with Intent
    reviewCode: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            files: z.array(z.string()),
            reviewType: z.enum(['security', 'performance', 'comprehensive']),
            focusAreas: z.string().optional()
        })
    ).mutation(async ({ ctx, input }) => {
        const { generateEmbedding } = await import('@/lib/gemini');
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
    }),

    // Debug Code with Intent
    debugCode: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            errorDescription: z.string(),
            suspectedFiles: z.array(z.string()).optional(),
            contextLevel: z.enum(['file', 'function', 'project', 'global'])
        })
    ).mutation(async ({ ctx, input }) => {
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
    }),

    // Refactor Code with Intent
    refactorCode: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            refactoringGoals: z.string(),
            targetFiles: z.array(z.string()).optional(),
            preserveAPI: z.boolean().default(true)
        })
    ).mutation(async ({ ctx, input }) => {
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
    }),

    // Explain Code with Intent
    explainCode: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            query: z.string(),
            targetFiles: z.array(z.string()).optional(),
            detailLevel: z.enum(['brief', 'detailed', 'comprehensive']).default('detailed')
        })
    ).mutation(async ({ ctx, input }) => {
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

        const detailLevelInstructions = {
            brief: 'Provide a concise, high-level explanation (2-3 sentences).',
            detailed: 'Provide a thorough explanation with key concepts and flow.',
            comprehensive: 'Provide an in-depth explanation covering all aspects, patterns, and nuances.'
        };

        const explainPrompt = `
        You are a senior software engineer explaining code to a colleague.

        Query: "${input.query}"
        Detail Level: ${input.detailLevel}

        Code to Explain:
        ${codeToExplain}

        ${detailLevelInstructions[input.detailLevel]}

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
    }),




    // Add new endpoint to get project status
    getProjectStatus: protectedProcedure.input(
        z.object({
            projectId: z.string(),
        })
    ).query(async ({ctx, input}) => {
        return await ctx.db.project.findUnique({
            where: {
                id: input.projectId
            },
            select: {
                id: true,
                name: true,
                status: true,
                totalFiles: true,
                processedFiles: true,
                processingLogs: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }),



    // Get all projects with status for queue view
    getProjectsWithStatus: protectedProcedure.query(async ({ctx}) => {
        const projects = await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null
            },
            select: {
                id: true,
                name: true,
                status: true,
                totalFiles: true,
                processedFiles: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return projects;
    }),
    getProjects: protectedProcedure.query(async ({ctx}) => {
        const projects = await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null,
                status: 'COMPLETED' // Only show completed projects in main list
            },
        });
        return projects;
    }),
    getCommits: protectedProcedure.input(
        z.object({
            projectId: z.string(),
        })
    ).query(async ({ctx, input}) => {
        pollCommits(input.projectId).then().catch(console.error)
        const commits = await ctx.db.commit.findMany({
            where: {
                projectId: input.projectId,
            }
        })
        return commits
    }),
    saveAnswer: protectedProcedure.input(
    z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesReferences: z.any().optional(),
        
        // Enhanced metadata for AI interactions
        metadata: z.object({
            // Intent classification data
            intent: z.object({
                type: z.enum(['question', 'code_generation', 'code_improvement', 'code_review', 'refactor', 'debug', 'explain']),
                confidence: z.number(),
                requiresCodeGen: z.boolean(),
                requiresFileModification: z.boolean(),
                contextNeeded: z.enum(['file', 'function', 'project', 'global']),
                targetFiles: z.array(z.string()).optional()
            }).optional(),
            
            // Generated code data
            generatedCode: z.object({
                content: z.string(),
                language: z.string(),
                filename: z.string().optional(),
                type: z.enum(['new_file', 'file_modification', 'code_snippet', 'multiple_files']).optional()
            }).optional(),
            
            // Code improvement data
            improvements: z.object({
                originalCode: z.string().optional(),
                improvedCode: z.string(),
                improvementType: z.enum(['performance', 'readability', 'security', 'optimization']).optional(),
                diff: z.string().optional(),
                suggestions: z.array(z.object({
                    type: z.string(),
                    description: z.string(),
                    code: z.string().optional()
                })).optional()
            }).optional(),
            
            // Code review data
            review: z.object({
                reviewType: z.enum(['security', 'performance', 'comprehensive']).optional(),
                issues: z.array(z.object({
                    type: z.string(),
                    severity: z.enum(['high', 'medium', 'low']),
                    file: z.string().optional(),
                    line: z.number().optional(),
                    description: z.string(),
                    suggestion: z.string()
                })).optional(),
                score: z.number().optional(),
                summary: z.string().optional()
            }).optional(),
            
            // Debug analysis data
            debug: z.object({
                diagnosis: z.string().optional(),
                solutions: z.array(z.object({
                    type: z.enum(['fix', 'workaround', 'investigation']),
                    description: z.string(),
                    code: z.string().optional(),
                    priority: z.enum(['high', 'medium', 'low'])
                })).optional(),
                investigationSteps: z.array(z.string()).optional()
            }).optional(),
            
            // Code explanation data
            explanation: z.object({
                detailLevel: z.enum(['brief', 'detailed', 'comprehensive']).optional(),
                keyPoints: z.array(z.string()).optional(),
                codeFlow: z.array(z.string()).optional(),
                patterns: z.array(z.string()).optional(),
                dependencies: z.array(z.string()).optional()
            }).optional(),
            
            // Refactoring data
            refactor: z.object({
                refactoredCode: z.string().optional(),
                changes: z.array(z.object({
                    file: z.string(),
                    changeType: z.enum(['create', 'modify', 'replace']),
                    description: z.string()
                })).optional(),
                preserveAPI: z.boolean().optional(),
                apiChanges: z.array(z.string()).optional()
            }).optional(),
            
            // Performance metrics
            performance: z.object({
                processingTime: z.number().optional(), // milliseconds
                responseTime: z.number().optional(),
                tokenCount: z.number().optional(),
                complexity: z.number().optional()
            }).optional(),
            
            // User interaction data
            userFeedback: z.object({
                helpful: z.boolean().optional(),
                rating: z.number().min(1).max(5).optional(),
                feedback: z.string().optional(),
                applied: z.boolean().optional(), // Did user apply the generated code
                modified: z.boolean().optional() // Did user modify the generated code
            }).optional(),
            
            // Additional context
            contextFiles: z.array(z.string()).optional(),
            sessionId: z.string().optional(),
            timestamp: z.date().optional()
        }).optional()
    })
    ).mutation(async ({ctx, input}) => {
    try {
        // Create the enhanced question record
        const question = await ctx.db.question.create({
            data: {
                question: input.question,
                answer: input.answer,
                filesReferences: input.filesReferences || [],
                projectId: input.projectId,
                userId: ctx.user.userId!,
                
                // Enhanced fields
                intent: input.metadata?.intent?.type || 'question',
                confidence: input.metadata?.intent?.confidence,
                processingTime: input.metadata?.performance?.processingTime,
                satisfaction: input.metadata?.userFeedback?.rating
            }
        });

        // Create AI interaction record for analytics
        if (input.metadata?.intent) {
            await ctx.db.aiInteraction.create({
                data: {
                    projectId: input.projectId,
                    userId: ctx.user.userId!,
                    intent: input.metadata.intent.type,
                    query: input.question,
                    confidence: input.metadata.intent.confidence,
                    contextFiles: input.metadata.contextFiles || input.metadata.intent.targetFiles || [],
                    metadata: {
                        requiresCodeGen: input.metadata.intent.requiresCodeGen,
                        requiresFileModification: input.metadata.intent.requiresFileModification,
                        contextNeeded: input.metadata.intent.contextNeeded,
                        ...input.metadata
                    },
                    responseType: input.metadata.generatedCode ? 'code' : 
                                input.metadata.review ? 'review' : 
                                input.metadata.debug ? 'debug' : 
                                input.metadata.explanation ? 'explanation' : 'answer',
                    responseTime: input.metadata.performance?.processingTime,
                    helpful: input.metadata.userFeedback?.helpful,
                    rating: input.metadata.userFeedback?.rating,
                    feedback: input.metadata.userFeedback?.feedback
                }
            });
        }

        // Create code generation record if applicable
        if (input.metadata?.generatedCode) {
            await ctx.db.codeGeneration.create({
                data: {
                    projectId: input.projectId,
                    userId: ctx.user.userId!,
                    prompt: input.question,
                    intent: input.metadata.intent?.type || 'code_generation',
                    requirements: {
                        language: input.metadata.generatedCode.language,
                        filename: input.metadata.generatedCode.filename,
                        type: input.metadata.generatedCode.type,
                        contextFiles: input.metadata.contextFiles || []
                    },
                    generatedCode: input.metadata.generatedCode.content,
                    filename: input.metadata.generatedCode.filename,
                    language: input.metadata.generatedCode.language,
                    linesOfCode: input.metadata.generatedCode.content.split('\n').length,
                    applied: input.metadata.userFeedback?.applied || false,
                    modified: input.metadata.userFeedback?.modified || false,
                    satisfaction: input.metadata.userFeedback?.rating
                }
            });
        }

        // Update file analytics for referenced files
        if (input.metadata?.contextFiles) {
            for (const fileName of input.metadata.contextFiles) {
                await ctx.db.fileAnalytics.upsert({
                    where: {
                        projectId_fileName: {
                            projectId: input.projectId,
                            fileName
                        }
                    },
                    update: {
                        queryCount: { increment: 1 },
                        lastQueried: new Date(),
                        contextUseCount: { increment: 1 }
                    },
                    create: {
                        projectId: input.projectId,
                        fileName,
                        queryCount: 1,
                        lastQueried: new Date(),
                        contextUseCount: 1
                    }
                });
            }
        }

        // Store suggestions feedback if provided
        if (input.metadata?.userFeedback && input.metadata.intent) {
            await ctx.db.suggestionFeedback.create({
                data: {
                    projectId: input.projectId,
                    userId: ctx.user.userId!,
                    suggestionType: input.metadata.intent.type === 'code_generation' ? 'smart_input' : 'intent_based',
                    suggestion: input.answer.substring(0, 500), // Truncate for storage
                    query: input.question,
                    accepted: input.metadata.userFeedback.applied || false,
                    helpful: input.metadata.userFeedback.helpful
                }
            });
        }

        return {
            question,
            saved: true,
            analytics: {
                aiInteractionCreated: !!input.metadata?.intent,
                codeGenerationCreated: !!input.metadata?.generatedCode,
                fileAnalyticsUpdated: input.metadata?.contextFiles?.length || 0,
                suggestionFeedbackCreated: !!input.metadata?.userFeedback
            }
        };

    } catch (error) {
        console.error('Error saving enhanced answer:', error);
        
        // Fallback to basic save if enhanced save fails
        const question = await ctx.db.question.create({
            data: {
                question: input.question,
                answer: input.answer,
                filesReferences: input.filesReferences || [],
                projectId: input.projectId,
                userId: ctx.user.userId!,
                intent: input.metadata?.intent?.type || 'question'
            }
        });
        
        return {
            question,
            saved: true,
            fallback: true,
            error: error.message
        };
    }
    }),

    // New query to get enhanced question analytics
    getQuestionAnalytics: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            timeRange: z.enum(['day', 'week', 'month', 'all']).optional().default('month')
        })
    ).query(async ({ctx, input}) => {
        const timeFilter = input.timeRange === 'all' ? undefined : {
            gte: new Date(Date.now() - (
                input.timeRange === 'day' ? 24 * 60 * 60 * 1000 :
                input.timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                30 * 24 * 60 * 60 * 1000 // month
            ))
        };

        const [
            intentDistribution,
            codeGenerationStats,
            userSatisfaction,
            mostReferencedFiles,
            recentInteractions
        ] = await Promise.all([
            // Intent distribution
            ctx.db.aiInteraction.groupBy({
                by: ['intent'],
                where: {
                    projectId: input.projectId,
                    ...(timeFilter && { createdAt: timeFilter })
                },
                _count: { intent: true },
                _avg: { confidence: true }
            }),

            // Code generation statistics
            ctx.db.codeGeneration.aggregate({
                where: {
                    projectId: input.projectId,
                    ...(timeFilter && { createdAt: timeFilter })
                },
                _count: { id: true },
                _avg: { 
                    satisfaction: true,
                    linesOfCode: true 
                },
                _sum: { 
                    applied: true,
                    modified: true 
                } as any
            }),

            // User satisfaction metrics
            ctx.db.aiInteraction.aggregate({
                where: {
                    projectId: input.projectId,
                    rating: { not: null },
                    ...(timeFilter && { createdAt: timeFilter })
                },
                _avg: { rating: true },
                _count: { helpful: true }
            }),

            // Most referenced files
            ctx.db.fileAnalytics.findMany({
                where: { projectId: input.projectId },
                orderBy: { queryCount: 'desc' },
                take: 10,
                select: {
                    fileName: true,
                    queryCount: true,
                    contextUseCount: true,
                    lastQueried: true
                }
            }),

            // Recent interactions
            ctx.db.aiInteraction.findMany({
                where: {
                    projectId: input.projectId,
                    ...(timeFilter && { createdAt: timeFilter })
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    intent: true,
                    confidence: true,
                    helpful: true,
                    rating: true,
                    createdAt: true,
                    responseTime: true
                }
            })
        ]);

        return {
            intentDistribution,
            codeGeneration: {
                totalGenerated: codeGenerationStats._count.id,
                avgSatisfaction: codeGenerationStats._avg.satisfaction,
                avgLinesOfCode: codeGenerationStats._avg.linesOfCode,
                totalApplied: codeGenerationStats._sum.applied,
                totalModified: codeGenerationStats._sum.modified,
                applicationRate: codeGenerationStats._count.id > 0 ? 
                    (codeGenerationStats._sum.applied || 0) / codeGenerationStats._count.id : 0
            },
            satisfaction: {
                avgRating: userSatisfaction._avg.rating,
                totalRatings: userSatisfaction._count.helpful
            },
            mostReferencedFiles,
            recentInteractions,
            timeRange: input.timeRange
        };
    }),
    // src/server/api/routers/project.ts - Enhanced getQuestions query

    getQuestions: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            // Add filtering options
            intent: z.enum(['question', 'code_generation', 'code_improvement', 'code_review', 'refactor', 'debug', 'explain']).optional(),
            timeRange: z.enum(['day', 'week', 'month', 'all']).optional().default('all'),
            sortBy: z.enum(['createdAt', 'satisfaction', 'confidence']).optional().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
            limit: z.number().min(1).max(100).optional().default(50)
        })
    ).query(async ({ ctx, input }) => {
        const timeFilter = input.timeRange === 'all' ? undefined : {
            gte: new Date(Date.now() - (
                input.timeRange === 'day' ? 24 * 60 * 60 * 1000 :
                input.timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                30 * 24 * 60 * 60 * 1000 // month
            ))
        };

        const questions = await ctx.db.question.findMany({
            where: {
                projectId: input.projectId,
                ...(input.intent && { intent: input.intent }),
                ...(timeFilter && { createdAt: timeFilter })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        imageUrl: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                [input.sortBy]: input.sortOrder
            },
            take: input.limit
        });

        // Enrich questions with analytics data
        const enrichedQuestions = await Promise.all(
            questions.map(async (question) => {
                // Get related AI interactions
                const aiInteractions = await ctx.db.aiInteraction.findMany({
                    where: {
                        projectId: input.projectId,
                        userId: question.userId,
                        query: question.question
                    },
                    select: {
                        id: true,
                        createdAt: true,
                        updatedAt: true,
                        query: true,
                        intent: true,
                        confidence: true,
                        helpful: true,
                        rating: true,
                        responseTime: true,
                        userId: true,
                        projectId: true,
                        contextFiles: true,
                        metadata: true,
                        modelUsed: true,
                        responseType: true,
                        success: true,
                        errorMessage: true,
                        feedback: true,
                        tokenCount: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                });

                // Get related code generations if applicable
                const codeGenerations = question.intent === 'code_generation' ? 
                    await ctx.db.codeGeneration.findMany({
                        where: {
                            projectId: input.projectId,
                            userId: question.userId,
                            prompt: question.question
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }) : [];

                // Parse metadata safely
                let parsedMetadata = null;
                try {
                    parsedMetadata = question.metadata ? 
                        (typeof question.metadata === 'string' ? 
                            JSON.parse(question.metadata) : 
                            question.metadata) : null;
                } catch (error) {
                    console.warn(`Failed to parse metadata for question ${question.id}:`, error);
                }

                return {
                    ...question,
                    metadata: parsedMetadata,
                    analytics: {
                        interactions: aiInteractions,
                        codeGenerations: codeGenerations,
                        hasEnhancedData: !!(aiInteractions.length || codeGenerations.length),
                        estimatedImpact: calculateQuestionImpact(
                            { 
                                intent: question.intent ?? undefined,
                                satisfaction: question.satisfaction ?? undefined
                            }, 
                            aiInteractions, 
                            codeGenerations.map(cg => ({
                                applied: cg.applied,
                                linesOfCode: cg.linesOfCode ?? undefined
                            }))
                        )
                    },
                    // Enhanced display properties
                    displayProperties: {
                        intentIcon: getIntentIcon(question.intent),
                        intentColor: getIntentColor(question.intent),
                        confidenceLevel: getConfidenceLevel(question.confidence),
                        satisfactionLevel: getSatisfactionLevel(question.satisfaction),
                        hasGeneratedCode: !!(parsedMetadata?.generatedCode || codeGenerations.length > 0),
                        hasFileReferences: !!(question.filesReferences && Array.isArray(question.filesReferences) && question.filesReferences.length > 0),
                        processingTimeFormatted: question.processingTime ? 
                            formatProcessingTime(question.processingTime) : null
                    }
                };
            })
        );

        // Get summary statistics
        const statistics = await getQuestionStatistics(ctx.db, input.projectId, input.timeRange);

        return {
            questions: enrichedQuestions,
            statistics,
            filters: {
                intent: input.intent,
                timeRange: input.timeRange,
                sortBy: input.sortBy,
                sortOrder: input.sortOrder
            },
            pagination: {
                total: enrichedQuestions.length,
                limit: input.limit,
                hasMore: enrichedQuestions.length === input.limit
            }
        };
    }),

    // Helper query to get detailed question statistics
    getQuestionStatistics: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            timeRange: z.enum(['day', 'week', 'month', 'all']).optional().default('month')
        })
    ).query(async ({ ctx, input }) => {
        return await getQuestionStatistics(ctx.db, input.projectId, input.timeRange);
    }),
    uploadMeeting: protectedProcedure.input(z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string()
    }))
    .mutation(async ({ctx, input}) => {
        const meeting = await ctx.db.meeting.create({
            data: {
                meetingUrl: input.meetingUrl,
                projectId: input.projectId,
                name: input.name,
                status: 'PROCESSING'
            }
        })
        return meeting
    }),
    getMeetings: protectedProcedure.input(z.object({projectId: z.string()})).query(async ({ctx, input}) => {
        return await ctx.db.meeting.findMany({
            where: {
                projectId: input.projectId
            },
            include: {
                issues: true
            }
        })
    }),
    deleteMeeting: protectedProcedure.input(z.object({
        meetingId: z.string()
    })).mutation(async ({ctx, input}) => {

        //First delete all associated issues.
        await ctx.db.issue.deleteMany({
            where: {
                meetingId: input.meetingId
            }
        });

        //Then delete the meeting
        return await ctx.db.meeting.delete({
            where: {
                id: input.meetingId
            }
        })
    }),
    getMeetingById: protectedProcedure.input(z.object({
        meetingId: z.string()
    })).query(async ({ctx, input}) => {
        return await ctx.db.meeting.findUnique({
            where: {
                id: input.meetingId
            },
            include: {
                issues: true
            }
        })
    }),
    deleteQuestion: protectedProcedure.input(z.object({
        questionId: z.string()
    })).mutation(async ({ctx, input}) => {
        const question = await ctx.db.question.findUnique({
            where: {
                id: input.questionId
            },
            select: {
                userId: true
            }
        });

        if (!question) {
            throw new Error('Question not found');
        }

        if (question.userId !== ctx.user.userId) {
            throw new Error('Unauthorized: You can only delete your own questions');
        }

        return await ctx.db.question.delete({
            where: {
                id: input.questionId
            }
        });
    }),
    archiveProject: protectedProcedure.input(z.object({
        projectId: z.string()
    })).mutation(async ({ctx, input}) => {
        return await ctx.db.project.update({
            where: {
                id: input.projectId
            },
            data: {
                deletedAt: new Date()
            }
        })
    }),
    getTeamMembers: protectedProcedure.input(z.object({
        projectId: z.string()
    })).query(async ({ctx, input}) => {
        return await ctx.db.userToProject.findMany({
            where: {
                projectId: input.projectId
            },
            include: {
                user: true
            }
        })
    }),
    getMyCredits: protectedProcedure.query(async ({ctx}) => {
        return await ctx.db.user.findUnique({
            where: {
                id: ctx.user.userId!
            },
            select: {
                credits: true
            }
        })
    }),
    checkCredits: protectedProcedure.input(z.object({
        githubUrl: z.string(),
        githubToken: z.string().optional()
    })).mutation(async ({ctx, input}) => {
        const fileCount = await checkCredits(input.githubUrl, input.githubToken ?? '')
        const userCredits = await ctx.db.user.findUnique({
            where: {
                id: ctx.user.userId!
            },
            select: {
                credits: true
            }
        })
        return { fileCount, userCredits: userCredits?.credits || 0 }
    })
})