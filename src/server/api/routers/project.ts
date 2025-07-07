import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "../trpc";
import { pollCommits } from "@/lib/github";
import { checkCredits } from "@/lib/github-loader";
import { inngest } from "@/lib/inngest/client";

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
        const { CodeGenerationEngine } = await import('@/lib/code-generation-engine');
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
        const { CodeGenerationEngine } = await import('@/lib/code-generation-engine');
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
        const { CodeGenerationEngine } = await import('@/lib/code-generation-engine');
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
            filesReferences: z.any()
        })
    ).mutation(async ({ctx, input}) => {
        const project = await ctx.db.question.create({
            data: {
                answer: input.answer,
                filesReferences: input.filesReferences,
                question: input.question,
                projectId: input.projectId,
                userId: ctx.user.userId!
            }
        })
        return project
    }),
    getQuestions: protectedProcedure.input(
        z.object({
            projectId: z.string()
        })).query(async({ctx, input}) => {
            return await ctx.db.question.findMany({
                where: {
                    projectId: input.projectId
                },
                include:{
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
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