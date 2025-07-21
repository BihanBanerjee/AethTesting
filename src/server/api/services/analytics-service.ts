import { type PrismaClient } from "@prisma/client";
import { calculateQuestionImpact, formatProcessingTime, getConfidenceLevel, getIntentColor, getIntentEmoji, getQuestionStatistics, getSatisfactionLevel } from "@/lib/intent";

type ServiceContext = {
  db: PrismaClient;
  user: { userId: string | null; };
  headers: Headers;
};

export const analyticsService = {
  async saveAnswer(
    ctx: ServiceContext,
    input: {
      projectId: string;
      question: string;
      answer: string;
      filesReferences?: string[];
      metadata?: {
        intent?: {
          type: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
          confidence: number;
          requiresCodeGen: boolean;
          requiresFileModification: boolean;
          contextNeeded: 'file' | 'function' | 'project' | 'global';
          targetFiles?: string[];
        };
        generatedCode?: {
          content: string;
          language: string;
          filename?: string;
          type?: 'new_file' | 'file_modification' | 'code_snippet' | 'multiple_files';
        };
        improvements?: {
          originalCode?: string;
          improvedCode: string;
          improvementType?: 'performance' | 'readability' | 'security' | 'optimization';
          diff?: string;
          suggestions?: Array<{
            type: string;
            description: string;
            code?: string;
          }>;
        };
        review?: {
          reviewType?: 'security' | 'performance' | 'comprehensive';
          issues?: Array<{
            type: string;
            severity: 'high' | 'medium' | 'low';
            file?: string;
            line?: number;
            description: string;
            suggestion: string;
          }>;
          score?: number;
          summary?: string;
        };
        debug?: {
          diagnosis?: string;
          solutions?: Array<{
            type: 'fix' | 'workaround' | 'investigation';
            description: string;
            code?: string;
            priority: 'high' | 'medium' | 'low';
          }>;
          investigationSteps?: string[];
        };
        explanation?: {
          detailLevel?: 'brief' | 'detailed' | 'comprehensive';
          keyPoints?: string[];
          codeFlow?: string[];
          patterns?: string[];
          dependencies?: string[];
        };
        refactor?: {
          refactoredCode?: string;
          changes?: Array<{
            file: string;
            changeType: 'create' | 'modify' | 'replace';
            description: string;
          }>;
          preserveAPI?: boolean;
          apiChanges?: string[];
        };
        performance?: {
          processingTime?: number;
          responseTime?: number;
          tokenCount?: number;
          complexity?: number;
        };
        userFeedback?: {
          helpful?: boolean;
          rating?: number;
          feedback?: string;
          applied?: boolean;
          modified?: boolean;
        };
        contextFiles?: string[];
        sessionId?: string;
        timestamp?: Date;
      };
    }
  ) {
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
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async getQuestionAnalytics(
    ctx: ServiceContext,
    input: {
      projectId: string;
      timeRange?: 'day' | 'week' | 'month' | 'all';
    }
  ) {
    const timeRange = input.timeRange || 'month';
    const timeFilter = timeRange === 'all' ? undefined : {
      gte: new Date(Date.now() - (
        timeRange === 'day' ? 24 * 60 * 60 * 1000 :
        timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 :
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
        }
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
        totalGenerated: codeGenerationStats._count?.id || 0,
        avgSatisfaction: codeGenerationStats._avg?.satisfaction || 0,
        avgLinesOfCode: codeGenerationStats._avg?.linesOfCode || 0,
        totalApplied: 0, // This would need to be calculated from a boolean field if it exists
        totalModified: 0, // This would need to be calculated from a boolean field if it exists
        applicationRate: 0 // Would be calculated based on actual boolean fields
      },
      satisfaction: {
        avgRating: userSatisfaction._avg.rating,
        totalRatings: userSatisfaction._count.helpful
      },
      mostReferencedFiles,
      recentInteractions,
      timeRange
    };
  },

  async getQuestions(
    ctx: ServiceContext,
    input: {
      projectId: string;
      intent?: 'question' | 'code_generation' | 'code_improvement' | 'code_review' | 'refactor' | 'debug' | 'explain';
      timeRange?: 'day' | 'week' | 'month' | 'all';
      sortBy?: 'createdAt' | 'satisfaction' | 'confidence';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
    }
  ) {
    const timeRange = input.timeRange || 'all';
    const sortBy = input.sortBy || 'createdAt';
    const sortOrder = input.sortOrder || 'desc';
    const limit = input.limit || 50;

    const timeFilter = timeRange === 'all' ? undefined : {
      gte: new Date(Date.now() - (
        timeRange === 'day' ? 24 * 60 * 60 * 1000 :
        timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 :
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
        [sortBy]: sortOrder
      },
      take: limit
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
            intentIcon: getIntentEmoji(question.intent),
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
    const statistics = await getQuestionStatistics(ctx.db, input.projectId, timeRange);

    return {
      questions: enrichedQuestions,
      statistics,
      filters: {
        intent: input.intent,
        timeRange,
        sortBy,
        sortOrder
      },
      pagination: {
        total: enrichedQuestions.length,
        limit,
        hasMore: enrichedQuestions.length === limit
      }
    };
  },

  async getQuestionStatistics(
    ctx: ServiceContext,
    input: {
      projectId: string;
      timeRange?: 'day' | 'week' | 'month' | 'all';
    }
  ) {
    const timeRange = input.timeRange || 'month';
    return await getQuestionStatistics(ctx.db, input.projectId, timeRange);
  }
};