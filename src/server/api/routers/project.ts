import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "../trpc";
import { pollCommits } from "@/lib/github";
import { inngest } from "@/lib/inngest/client";
import { analyticsService } from "../services/analytics-service";
import { meetingService } from "../services/meeting-service";
import { projectUtils } from "../services/project-utils";

export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
        })
    ).mutation(async ({ctx, input}) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, fileCount } = await projectUtils.validateUserCredits(
            ctx,
            input.githubUrl,
            input.githubToken
        );

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
            classifyOnly: z.boolean().optional(),
            
            // Code generation specific parameters
            requirements: z.object({
                framework: z.string().optional(),
                language: z.string().optional(),
                features: z.array(z.string()).optional(),
                constraints: z.array(z.string()).optional()
            }).optional(),
            
            // Code improvement specific parameters
            improvementType: z.enum(['performance', 'readability', 'security', 'optimization']).optional(),
            
            // Code review specific parameters
            reviewType: z.enum(['security', 'performance', 'comprehensive']).optional(),
            focusAreas: z.string().optional(),
            
            // Debug specific parameters
            errorDescription: z.string().optional(),
            contextLevel: z.enum(['file', 'function', 'project', 'global']).optional(),
            
            // Refactor specific parameters
            refactoringGoals: z.string().optional(),
            preserveAPI: z.boolean().optional(),
            
            // Explain specific parameters
            detailLevel: z.enum(['brief', 'detailed', 'comprehensive']).optional()
        })
    ).mutation(async ({ ctx, input }) => {
        const { IntentClassifier } = await import('@/lib/intent-classifier');
        const classifier = new IntentClassifier();

        // Classify intent (use provided intent or classify from query)
        const intent = await classifier.classifyQuery(input.query);
        if (input.intent) {
            intent.type = input.intent as 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'debug' | 'refactor' | 'explain';
        }

        // If only classification is requested, return early
        if (input.classifyOnly) {
            return { intent };
        }

        // Route to appropriate strategy through unified CodeGenerationEngine
        switch (intent.type) {
            case 'code_generation':
            case 'code_improvement':
            case 'debug':
            case 'refactor':
            case 'code_review':
            case 'explain':
                const { CodeGenerationEngine } = await import('@/lib/code-generation');
                const { UnifiedResponseAdapter } = await import('@/lib/code-generation/unified-response-adapter');
                
                const engine = new CodeGenerationEngine();
                const result = await engine.generateCode({
                    intent,
                    query: input.query,
                    projectId: input.projectId,
                    contextFiles: input.contextFiles,
                    targetFile: input.contextFiles?.[0]
                });
                
                return UnifiedResponseAdapter.adaptCodeGenerationResult(result, intent.type);

            case 'question':
            default:
                // Existing Q&A logic for question intent and fallback
                const { performVectorSearch } = await import('@/app/(protected)/dashboard/actions/database/vector-search');
                const { buildIntentAwarePrompt } = await import('@/app/(protected)/dashboard/actions/prompts/intent-prompts');
                const { google, MODEL_CONFIG } = await import('@/app/(protected)/dashboard/actions/config/ai-config');
                const { getSearchConfig } = await import('@/app/(protected)/dashboard/actions/config/search-config');
                
                // Perform vector search
                const searchConfig = getSearchConfig(intent.type);
                const vectorResult = await performVectorSearch(input.query, input.projectId, searchConfig);
                
                // Build context string
                let context = '';
                for (const doc of vectorResult) {
                    context += `source: ${doc.fileName}\ncode content:${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
                }
                
                // Build intent-aware prompt
                const systemPrompt = buildIntentAwarePrompt(intent.type, input.query, context);
                
                // Get AI response directly (non-streaming)
                const { generateText } = await import('ai');
                const response = await generateText({
                    model: google(MODEL_CONFIG.QUESTION_ANSWERING),
                    prompt: systemPrompt
                });
                
                const finalAnswer = response.text || 'No response generated';

                return {
                    intent,
                    answer: finalAnswer,
                    filesReferences: vectorResult
                };
        }
    }),

    // Dedicated Intent Classification Endpoint
    classifyIntent: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            query: z.string(),
        })
    ).mutation(async ({ ctx, input }) => {
        const { IntentClassifier } = await import('@/lib/intent-classifier');
        const classifier = new IntentClassifier();

        // Classify the intent
        const intent = await classifier.classifyQuery(input.query);

        return { intent };
    }),


    // New endpoint to get project status
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


    // All projects with status for queue view
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
        return await analyticsService.saveAnswer(ctx, input);
    }),

    // New query to get enhanced question analytics
    getQuestionAnalytics: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            timeRange: z.enum(['day', 'week', 'month', 'all']).optional().default('month')
        })
    ).query(async ({ctx, input}) => {
        return await analyticsService.getQuestionAnalytics(ctx, input);
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
        return await analyticsService.getQuestions(ctx, input);
    }),

    // Helper query to get detailed question statistics
    getQuestionStatistics: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            timeRange: z.enum(['day', 'week', 'month', 'all']).optional().default('month')
        })
    ).query(async ({ ctx, input }) => {
        return await analyticsService.getQuestionStatistics(ctx, input);
    }),
    uploadMeeting: protectedProcedure.input(z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string()
    }))
    .mutation(async ({ctx, input}) => {
        return await meetingService.uploadMeeting(ctx, input);
    }),
    getMeetings: protectedProcedure.input(z.object({projectId: z.string()})).query(async ({ctx, input}) => {
        return await meetingService.getMeetings(ctx, input);
    }),
    deleteMeeting: protectedProcedure.input(z.object({
        meetingId: z.string()
    })).mutation(async ({ctx, input}) => {
        return await meetingService.deleteMeeting(ctx, input);
    }),
    getMeetingById: protectedProcedure.input(z.object({
        meetingId: z.string()
    })).query(async ({ctx, input}) => {
        return await meetingService.getMeetingById(ctx, input);
    }),
    deleteQuestion: protectedProcedure.input(z.object({
        questionId: z.string()
    })).mutation(async ({ctx, input}) => {
        return await projectUtils.deleteQuestion(ctx, input.questionId);
    }),
    archiveProject: protectedProcedure.input(z.object({
        projectId: z.string()
    })).mutation(async ({ctx, input}) => {
        return await projectUtils.archiveProject(ctx, input.projectId);
    }),
    getTeamMembers: protectedProcedure.input(z.object({
        projectId: z.string()
    })).query(async ({ctx, input}) => {
        return await projectUtils.getProjectTeamMembers(ctx, input.projectId);
    }),
    getMyCredits: protectedProcedure.query(async ({ctx}) => {
        return await projectUtils.getUserCredits(ctx);
    }),
    checkCredits: protectedProcedure.input(z.object({
        githubUrl: z.string(),
        githubToken: z.string().optional()
    })).mutation(async ({ctx, input}) => {
        const fileCount = await projectUtils.checkProjectFileCount(input.githubUrl, input.githubToken);
        const userCredits = await projectUtils.getUserCredits(ctx);
        return { fileCount, userCredits: userCredits?.credits || 0 };
    })
})